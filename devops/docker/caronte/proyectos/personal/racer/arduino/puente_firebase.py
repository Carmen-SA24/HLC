#!/usr/bin/env python3
"""Puente entre Arduino y Firebase.

Lee líneas desde el puerto serie con estos formatos:
UID_HEX;RESULTADO
YYYY/MM/DD;HH:MM:SS;UID_HEX;RESULTADO

Si el Arduino solo envía UID y resultado, el puente añade la fecha y hora
actuales antes de guardar en Firebase.

Si Firebase no está disponible, el registro se guarda en pendientes.json
y un hilo aparte intenta reenviarlo sin bloquear la lectura del Arduino.
"""

from __future__ import annotations

import json
import logging
import os
import re
import socket
import tempfile
import threading
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

import firebase_admin
import serial
from firebase_admin import credentials, db, firestore
from dotenv import load_dotenv

# Cargar variables desde frontend/.env
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
load_dotenv(FRONTEND_DIR / ".env")

# CONFIGURACIÓN

PUERTO_USB = os.getenv("PUERTO_USB", "COM3")
BAUD_RATE = int(os.getenv("BAUD_RATE", "9600"))
SERIAL_TIMEOUT = float(os.getenv("SERIAL_TIMEOUT", "0.2"))
SYNC_INTERVAL_SECONDS = float(os.getenv("SYNC_INTERVAL_SECONDS", "5"))
NETWORK_CHECK_TIMEOUT = float(os.getenv("NETWORK_CHECK_TIMEOUT", "1.5"))
PENDIENTES_FILE = Path(os.getenv("PENDIENTES_FILE", "pendientes.json"))

# Si es true, guarda la línea original y la hora de recepción en Firestore.
INCLUDE_DEBUG_FIELDS = os.getenv("INCLUDE_DEBUG_FIELDS", "false").strip().lower() in ("1", "true", "yes")

# Si es true, muestra en los logs las variantes de UID que se buscan.
DEBUG_UID_LOOKUP = os.getenv("DEBUG_UID_LOOKUP", "false").strip().lower() in ("1", "true", "yes")

FIREBASE_CREDENTIALS = os.getenv(
    "FIREBASE_CREDENTIALS",
    "credenciales.json",
)
FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL", "")
FIREBASE_NODE = os.getenv("FIREBASE_NODE", "registros_acceso")
FIRESTORE_ACCESOS_COLLECTION = os.getenv("FIRESTORE_ACCESOS_COLLECTION", "accesos")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("racer-bridge")

file_lock = threading.RLock()
stop_event = threading.Event()
firebase_habilitado = False
rtdb_habilitado = False
firestore_client = None

# Líneas del escaneo de arranque que el puente debe ignorar silenciosamente
LINEAS_DIAGNOSTICO = {
    "Sistema R.A.C.E.R. listo",
    "LCD 20x4: OK",
    "RFID RC522: OK",
    "RTC DS3231: OK",
    "RTC DS3231: ERROR",
    "LED Verde: OK",
    "LED Rojo: OK",
    "Buzzer: OK",
    "TODOS LOS COMPONENTES OK",
}


def es_linea_diagnostico(linea: str) -> bool:
    """Devuelve True si la línea es parte del escaneo de arranque del Arduino."""
    linea = linea.strip()
    if linea in LINEAS_DIAGNOSTICO:
        return True
    # También ignorar cualquier línea que empiece por estos prefijos
    prefijos = ("Sistema R.A.C.E.R.", "LCD 20x4", "RFID RC522", "RTC DS3231",
                "LED Verde", "LED Rojo", "Buzzer", "TODOS LOS COMPONENTES")
    return any(linea.startswith(p) for p in prefijos)


def _extraer_bytes_hex(uid_rfid: str) -> List[str]:
    # Saca los pares de letras/números hex de un UID (ej: AA, BB, CC)
    return re.findall(r"[0-9a-fA-F]{2}", uid_rfid or "")


def normalizar_uid_rfid(uid_rfid: str) -> str:
    # Convierte el UID a AA:BB:CC:DD (mayúsculas)
    # Si no tiene formato válido, lo devuelve tal cual
    uid_rfid = (uid_rfid or "").strip()
    bytes_hex = _extraer_bytes_hex(uid_rfid)
    if bytes_hex:
        return ":".join(b.upper() for b in bytes_hex)
    return uid_rfid


def variantes_uid_rfid(uid_rfid: str) -> List[str]:
    # Genera distintas formas del mismo UID (con :, con espacios, sin separadores...)
    canon = normalizar_uid_rfid(uid_rfid)
    bytes_hex = canon.split(":") if ":" in canon else _extraer_bytes_hex(canon)

    variantes: List[str] = []
    if bytes_hex:
        variantes.append(":".join(b.upper() for b in bytes_hex))
        variantes.append(" ".join(b.upper() for b in bytes_hex))
        variantes.append("".join(b.upper() for b in bytes_hex))
    if canon:
        variantes.append(canon)
        variantes.append(canon.lower())

    # Eliminar variantes repetidas y dejar solo las 10 primeras
    vistos = set()
    unicos: List[str] = []
    for v in variantes:
        v = v.strip()
        if not v or v in vistos:
            continue
        vistos.add(v)
        unicos.append(v)
        if len(unicos) >= 10:
            break
    return unicos


def obtener_tarjeta_por_uid(uid_rfid: str) -> Optional[Dict[str, Any]]:
    # Busca una tarjeta en Firestore por su UID
    if firestore_client is None:
        return None

    candidatos = variantes_uid_rfid(uid_rfid)
    if not candidatos:
        return None

    if DEBUG_UID_LOOKUP:
        logger.info("Buscando UID '%s' con variantes: %s", uid_rfid, candidatos)

    try:
        from google.cloud.firestore_v1.base_query import FieldFilter
        coincidencias = (
            firestore_client.collection("tarjetas")
            .where(filter=FieldFilter("uid_rfid", "in", candidatos))
            .limit(1)
            .stream()
        )
        tarjeta = next(coincidencias, None)
        if tarjeta is None:
            return None
        return tarjeta.to_dict() or {}
    except Exception as exc:
        logger.warning("No se pudo consultar tarjeta por UID (%s): %s", uid_rfid, exc)
        return None


def resolver_credenciales_firebase() -> Optional[Path]:
    # Busca el archivo JSON de credenciales de Firebase
    ruta_configurada = Path(FIREBASE_CREDENTIALS)
    if ruta_configurada.exists():
        return ruta_configurada

    patrones = [
        "proyecto-racer-firebase-adminsdk-*.json",
        "proyecto-racer-firebase*.json",
        "*.json",
    ]

    for patron in patrones:
        coincidencias = sorted(Path.cwd().glob(patron))
        for candidata in coincidencias:
            if candidata.name != PENDIENTES_FILE.name:
                return candidata

    return None


# MODELO DE DATOS

@dataclass
class RegistroAcceso:
    id_local: str
    fecha: str
    hora: str
    uid: str
    resultado: str
    raw_line: str
    received_at: str
    timestamp: int
    nombre_estudiante: str = ""
    curso: str = ""
    motivo: str = ""
    estudiante_id: str = ""
    tipo_acceso: str = "entrada"  # "entrada" o "salida" - se determina por alternancia
    synced: bool = False
    retry_count: int = 0

    def to_firebase_payload(self) -> Dict[str, Any]:
        # Prepara los datos para guardarlos en Firestore
        payload: Dict[str, Any] = {
            "curso": self.curso,
            "fecha": self.fecha,
            "hora": self.hora,
            "nombre_estudiante": self.nombre_estudiante,
            "resultado": self.resultado,
            "tipo_acceso": self.tipo_acceso,
            "timestamp": self.timestamp,
            "uid_tarjeta": self.uid,
            "estudiante_id": self.estudiante_id,
        }

        # Solo se incluye motivo cuando es DENEGADO (el panel lo usa en notificaciones).
        if self.resultado == "DENEGADO" and self.motivo:
            payload["motivo"] = self.motivo
            payload["resultado_denegacion"] = self.motivo

        if INCLUDE_DEBUG_FIELDS:
            payload["raw_line"] = self.raw_line
            payload["received_at"] = self.received_at

        return payload

    def to_realtime_payload(self) -> Dict[str, Any]:
        # Prepara los datos para guardarlos en Realtime Database
        return {
            "fecha": self.fecha,
            "hora": self.hora,
            "uid": self.uid,
            "resultado": self.resultado,
            "raw_line": self.raw_line,
            "received_at": self.received_at,
            "synced": True,
        }

    @classmethod
    def from_raw_line(cls, raw_line: str) -> Optional["RegistroAcceso"]:
        # Convierte una línea de texto del Arduino en un RegistroAcceso
        # Formato "ID: XX XX XX XX | Alumno: ..."
        if "ID:" in raw_line and "|" in raw_line:
            try:
                # Buscar el UID en el texto (4-7 pares de letras/números)
                match_uid = re.search(r"ID:\s*([0-9a-fA-F\s:]+)", raw_line)
                if match_uid:
                    uid = match_uid.group(1).strip()
                    # Si la línea contiene PERMITIDO, se da por CONCEDIDO
                    resultado = "CONCEDIDO" if "PERMITIDO" in raw_line.upper() else "PENDIENTE"
                    
                    # Hora actual del sistema
                    fecha_hora_local = datetime.now()
                    return cls(
                        id_local=str(uuid4()),
                        fecha=fecha_hora_local.strftime("%d/%m/%Y"),
                        hora=fecha_hora_local.strftime("%H:%M:%S"),
                        uid=normalizar_uid_rfid(uid),
                        resultado=resultado,
                        raw_line=raw_line,
                        received_at=datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
                        timestamp=int(fecha_hora_local.timestamp() * 1000),
                    )
            except Exception as e:
                logger.debug("Error al leer formato ID:| : %s", e)

        # Formato separado por punto y coma (;) o coma (,)
        if ";" in raw_line:
            partes = [parte.strip() for parte in raw_line.split(";")]
        else:
            partes = [parte.strip() for parte in raw_line.split(",")]
        
        if len(partes) not in (2, 4):
            return None

        if len(partes) == 4:
            fecha, hora, uid, resultado = partes
            # Intentar con formato YYYY/MM/DD primero
            try:
                fecha_hora_local = datetime.strptime(f"{fecha} {hora}", "%Y/%m/%d %H:%M:%S")
            except ValueError:
                # Si falla, probar con DD/MM/YYYY
                try:
                    fecha_hora_local = datetime.strptime(f"{fecha} {hora}", "%d/%m/%Y %H:%M:%S")
                except ValueError:
                    # Si no se reconoce la fecha, usar la hora actual
                    fecha_hora_local = datetime.now()
        else:
            uid, resultado = partes
            fecha_hora_local = datetime.now()
            fecha = fecha_hora_local.strftime("%d/%m/%Y")
            hora = fecha_hora_local.strftime("%H:%M:%S")

        try:
            timestamp = int(fecha_hora_local.timestamp() * 1000)
            # Asegurar formato DD/MM/YYYY para Firestore
            fecha = fecha_hora_local.strftime("%d/%m/%Y")
            hora = fecha_hora_local.strftime("%H:%M:%S")
        except (ValueError, AttributeError):
            fecha_hora_local = datetime.now()
            fecha = fecha_hora_local.strftime("%d/%m/%Y")
            hora = fecha_hora_local.strftime("%H:%M:%S")
            timestamp = int(fecha_hora_local.timestamp() * 1000)

        return cls(
            id_local=str(uuid4()),
            fecha=fecha,
            hora=hora,
            uid=normalizar_uid_rfid(uid),
            resultado=resultado,
            raw_line=raw_line,
            received_at=datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
            timestamp=timestamp,
        )


# FIREBASE

def inicializar_firebase() -> None:
    # Conecta con Firebase usando el archivo de credenciales
    global firebase_habilitado, rtdb_habilitado, firestore_client

    ruta_credenciales = resolver_credenciales_firebase()

    if ruta_credenciales is None:
        logger.warning(
            "No se encontró el archivo JSON de credenciales. El script seguirá en modo offline."
        )
        firebase_habilitado = False
        return

    if firebase_admin._apps:
        firebase_habilitado = True
        rtdb_habilitado = bool(FIREBASE_DATABASE_URL.strip())
        if firestore_client is None:
            firestore_client = firestore.client()
        return

    cred = credentials.Certificate(str(ruta_credenciales))
    init_opts: Dict[str, Any] = {}
    if FIREBASE_DATABASE_URL.strip():
        init_opts["databaseURL"] = FIREBASE_DATABASE_URL
        rtdb_habilitado = True
    else:
        rtdb_habilitado = False

    firebase_admin.initialize_app(cred, init_opts)
    firestore_client = firestore.client()
    firebase_habilitado = True


def enriquecer_registro_con_tarjeta(registro: RegistroAcceso) -> RegistroAcceso:
    # Añade el nombre y curso del estudiante al registro buscando la tarjeta en Firestore
    if firestore_client is None:
        return registro

    try:
        data = obtener_tarjeta_por_uid(registro.uid)
        if not data:
            return registro
        registro.nombre_estudiante = str(data.get("nombre_estudiante", "")).strip()
        registro.curso = str(data.get("curso", "")).strip()
        return registro
    except Exception as exc:
        logger.warning("No se pudo enriquecer el registro con datos de tarjeta: %s", exc)
        return registro


def push_a_firebase(registro: RegistroAcceso) -> None:
    # Guarda un registro de acceso en Firestore (y en Realtime Database si está configurado)
    if not firebase_habilitado:
        raise RuntimeError("Firebase no está configurado")

    registro = enriquecer_registro_con_tarjeta(registro)

    # Guardar en Firestore (lo usa la web)
    firestore_payload = registro.to_firebase_payload()
    firestore_client.collection(FIRESTORE_ACCESOS_COLLECTION).document(registro.id_local).set(firestore_payload)

    # Copia opcional a Realtime Database (solo si está configurada)
    if rtdb_habilitado:
        ref = db.reference(FIREBASE_NODE)
        ref.child(registro.id_local).set({
            **registro.to_realtime_payload(),
            "timestamp": registro.timestamp,
            "uid_tarjeta": registro.uid,
            "nombre_estudiante": registro.nombre_estudiante,
            "curso": registro.curso,
        })


# COLA LOCAL

def cargar_pendientes() -> List[Dict[str, Any]]:
    # Lee los registros pendientes guardados en pendientes.json
    with file_lock:
        if not PENDIENTES_FILE.exists():
            return []

        try:
            contenido = PENDIENTES_FILE.read_text(encoding="utf-8").strip()
            if not contenido:
                return []
            data = json.loads(contenido)
            if isinstance(data, list):
                return data
            logger.warning("El archivo de pendientes no contiene una lista válida.")
            return []
        except Exception as exc:
            logger.error("No se pudo leer %s: %s", PENDIENTES_FILE, exc)
            return []


def guardar_pendientes(pendientes: List[Dict[str, Any]]) -> None:
    # Guarda la lista de pendientes en pendientes.json
    with file_lock:
        tmp_fd, tmp_path = tempfile.mkstemp(prefix="pendientes_", suffix=".json")
        try:
            with os.fdopen(tmp_fd, "w", encoding="utf-8") as tmp_file:
                json.dump(pendientes, tmp_file, ensure_ascii=False, indent=2)
            Path(tmp_path).replace(PENDIENTES_FILE)
        finally:
            if Path(tmp_path).exists():
                try:
                    Path(tmp_path).unlink()
                except OSError:
                    pass


def agregar_pendiente(registro: RegistroAcceso) -> None:
    # Añade un registro a la cola de pendientes (cuando Firebase falla)
    pendientes = cargar_pendientes()
    pendientes.append(asdict(registro))
    guardar_pendientes(pendientes)
    logger.info("Registro guardado localmente en pendientes.json")


# VALIDACIÓN Y CONTROL DE ACCESO

def determinar_tipo_acceso_alternancia(estudiante_id: str) -> str:
    """Determina si el siguiente acceso es 'entrada' o 'salida' según el último registro.

    Lógica de alternancia:
    - Si el estudiante NO tiene registros previos → 'entrada' (primera vez)
    - Si su último registro fue 'entrada' → 'salida'
    - Si su último registro fue 'salida' → 'entrada'
    """
    if firestore_client is None:
        return "entrada"

    try:
        ultimos = (
            firestore_client
            .collection(FIRESTORE_ACCESOS_COLLECTION)
            .where("estudiante_id", "==", estudiante_id)
            .order_by("timestamp", direction="DESCENDING")
            .limit(1)
            .get()
        )

        if not ultimos:
            return "entrada"

        ultimo = ultimos[0].to_dict()
        ultimo_tipo = ultimo.get("tipo_acceso", "salida")
        return "entrada" if ultimo_tipo == "salida" else "salida"

    except Exception as exc:
        logger.warning("Error determinando tipo de acceso: %s", exc)
        return "entrada"


def validar_acceso_y_controlador_arduino(uid_rfid: str, arduino_serial) -> tuple:
    # Comprueba si la tarjeta está autorizada y envía el resultado al Arduino
    # Retorna: (permitido, motivo, nombre_estudiante, tipo_acceso, estudiante_id)
    if firestore_client is None:
        logger.warning("Firestore no disponible. Se permite el acceso para no bloquear.")
        return True, "firebase_no_disponible", "", "entrada", ""

    try:
        uid_rfid_norm = normalizar_uid_rfid(uid_rfid)
        tarjeta_data = obtener_tarjeta_por_uid(uid_rfid_norm)
        if not tarjeta_data:
            logger.warning("Tarjeta no registrada: %s", uid_rfid_norm)
            enviar_resultado_arduino(arduino_serial, False, "No registrada", "", "")
            return False, "sin_registrar", "", "entrada", ""

        nombre_estudiante = str(tarjeta_data.get("nombre_estudiante", "")).strip()
        estudiante_id = str(tarjeta_data.get("estudiante_id", "")).strip()

        if not tarjeta_data.get("activo", False):
            logger.warning("Tarjeta bloqueada: %s", uid_rfid_norm)
            enviar_resultado_arduino(arduino_serial, False, "Tarjeta Bloqueada", nombre_estudiante, "")
            return False, "tarjeta_bloqueada", nombre_estudiante, "entrada", estudiante_id

        # Determinar si es entrada o salida por alternancia
        tipo_acceso = determinar_tipo_acceso_alternancia(estudiante_id) if estudiante_id else "entrada"

        logger.info(
            "Acceso PERMITIDO: %s - %s (%s)",
            uid_rfid_norm, nombre_estudiante, tipo_acceso
        )
        enviar_resultado_arduino(arduino_serial, True, "Acceso permitido", nombre_estudiante, tipo_acceso)
        return True, "acceso_permitido", nombre_estudiante, tipo_acceso, estudiante_id

    except Exception as exc:
        logger.error("Error validando acceso: %s", exc)
        enviar_resultado_arduino(arduino_serial, False, "Error sistema", "", "")
        return False, "error_sistema", "", "entrada", ""


def enviar_resultado_arduino(arduino_serial, permitido: bool, motivo: str, nombre: str, tipo_acceso: str = "") -> None:
    # Envía PERMITIDO o DENEGADO al Arduino con el nombre y tipo para la LCD
    # Formato: RESULTADO|PERMITIDO/DENEGADO|NOMBRE|MOTIVO|TIPO_ACCESO
    try:
        if not arduino_serial or not arduino_serial.is_open:
            logger.warning("Puerto Arduino no disponible")
            return

        nombre_limpio = nombre[:20] if nombre else "Desconocido"
        estado = "PERMITIDO" if permitido else "DENEGADO"
        
        mensaje = f"RESULTADO|{estado}|{nombre_limpio}|{motivo}|{tipo_acceso}\r\n"
        arduino_serial.write(mensaje.encode("utf-8"))
        arduino_serial.flush()
        logger.info("Enviado al Arduino: %s", mensaje.strip())
        
    except Exception as exc:
        logger.warning("Error enviando resultado al Arduino: %s", exc)


def enviar_comando_arduino(arduino_serial, comando: str) -> None:
    # Envía una orden al Arduino (pitidos, LEDs)
    try:
        if not arduino_serial or not arduino_serial.is_open:
            logger.warning("Puerto Arduino no disponible para enviar comando")
            return

        arduino_serial.write(f"{comando}\n".encode("utf-8"))
        logger.info("Comando enviado al Arduino: %s", comando)
    except Exception as exc:
        logger.warning("No se pudo enviar comando al Arduino: %s", exc)


# CONECTIVIDAD Y SINCRONIZACIÓN

def hay_internet() -> bool:
    # Comprueba si hay conexión a Internet (haciendo una prueba con 8.8.8.8)
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=NETWORK_CHECK_TIMEOUT).close()
        return True
    except OSError:
        return False


def sincronizar_pendientes() -> None:
    # Intenta enviar a Firebase los registros que quedaron pendientes
    pendientes = cargar_pendientes()
    if not pendientes:
        return

    if not firebase_habilitado:
        logger.info(
            "Firebase sigue deshabilitado. Se conservan %d registros pendientes en local.",
            len(pendientes),
        )
        return

    if not hay_internet():
        logger.info("Sin conexión a Internet. Se mantiene la cola local con %d registros.", len(pendientes))
        return

    pendientes_restantes: List[Dict[str, Any]] = []
    enviados = 0

    for indice, item in enumerate(pendientes):
        try:
            registro = RegistroAcceso(**item)
            push_a_firebase(registro)
            enviados += 1
        except Exception as exc:
            logger.warning("No se pudo sincronizar un registro pendiente: %s", exc)
            pendientes_restantes.append(item)
            pendientes_restantes.extend(pendientes[indice + 1 :])
            break

    if enviados:
        logger.info("Sincronizados %d registro(s) pendiente(s) con Firebase.", enviados)

    guardar_pendientes(pendientes_restantes)


def worker_sincronizacion() -> None:
    # Bucle que cada cierto tiempo intenta sincronizar los pendientes
    while not stop_event.is_set():
        try:
            sincronizar_pendientes()
        except Exception as exc:
            logger.warning("Error en el hilo de sincronización: %s", exc)
        stop_event.wait(SYNC_INTERVAL_SECONDS)


# LECTURA SERIE

def leer_arduino() -> None:
    # Lee el puerto serie, procesa las tarjetas y envía los resultados
    try:
        arduino = serial.Serial(PUERTO_USB, BAUD_RATE, timeout=SERIAL_TIMEOUT)
        logger.info("Conectado al Arduino en %s @ %s baud", PUERTO_USB, BAUD_RATE)
        time.sleep(2)
    except Exception as exc:
        logger.error("No se pudo abrir el puerto serie: %s", exc)
        raise SystemExit(1)

    try:
        while not stop_event.is_set():
            try:
                linea_bytes = arduino.readline()
                if not linea_bytes:
                    continue

                linea = linea_bytes.decode("utf-8", errors="ignore").strip()
                if not linea:
                    continue

                # Ignorar silenciosamente las líneas del escaneo de arranque
                if es_linea_diagnostico(linea):
                    logger.debug("Diagnóstico Arduino: %s", linea)
                    continue

                logger.info("Recibido del Arduino: %s", linea)
                registro = RegistroAcceso.from_raw_line(linea)

                if registro is None:
                    logger.warning("Formato incorrecto. Se ignoró la línea.")
                    continue

                # Validar la tarjeta y enviar el resultado al Arduino
                # Ahora devuelve 5 valores: (permitido, motivo, nombre, tipo_acceso, estudiante_id)
                permitido, motivo, nombre, tipo_acceso, estudiante_id = validar_acceso_y_controlador_arduino(registro.uid, arduino)
                registro.resultado = "CONCEDIDO" if permitido else "DENEGADO"
                registro.nombre_estudiante = nombre
                registro.motivo = "" if permitido else motivo
                registro.tipo_acceso = tipo_acceso
                registro.estudiante_id = estudiante_id

                try:
                    push_a_firebase(registro)
                    logger.info(
                        "Registro subido a Firebase con éxito: %s - %s",
                        tipo_acceso, registro.nombre_estudiante
                    )
                except Exception as exc:
                    logger.warning("Fallo al subir a Firebase. Se guarda localmente: %s", exc)
                    agregar_pendiente(registro)

            except Exception as exc:
                logger.warning("Error inesperado en la lectura serie: %s", exc)
    except KeyboardInterrupt:
        logger.info("Script detenido por el usuario.")
    finally:
        try:
            arduino.close()
        except Exception:
            pass
        stop_event.set()


# MAIN

def main() -> None:
    # Punto de entrada: inicia Firebase, lanza el hilo de sincronización y empieza a leer el Arduino
    inicializar_firebase()

    hilo_sync = threading.Thread(target=worker_sincronizacion, daemon=True)
    hilo_sync.start()

    logger.info("Escuchando tarjetas... (cola local activada por si falla Firebase)")
    leer_arduino()


if __name__ == "__main__":
    main()