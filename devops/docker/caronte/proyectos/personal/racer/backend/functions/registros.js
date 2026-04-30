/* ===== FUNCIÓN CLOUD: Gestión de Registros de Acceso =====
 *
 * Maneja los registros de acceso RFID del sistema R.A.C.E.R.
 * Crea registros, valida accesos y registra en auditoría.
 *
 * POST   /registros       → Crear registro de acceso (desde Arduino)
 * GET    /registros       → Listar registros con filtros
 * GET    /registros/:id   → Historial de un estudiante
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

const app = express();
app.use(express.json());

const { db } = require('../../config/firebase');
const { registrarAuditoriaDetallada } = require('../utils/helpers');

/* ===== MIDDLEWARE (INTERMEDIARIO) =====
 * Verifica que el token JWT del header Authorization sea válido.
 * Si es válido, guarda los datos del usuario en req.usuario.
 * Si no, devuelve error 401.
 */
const verificarToken = async (req, res, next) => {
  try {
    // Extraer token del header: "Bearer <token_aqui>"
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Verificar el token con Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.usuario = decodedToken; // Guardamos info del usuario para usarla después
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

/* ===== FUNCIONES AUXILIARES =====
 * Determina el período escolar del acceso (recreo, almuerzo, etc).
 * Es solo para clasificar, no para validar turnos.
 * Ej: 10:30 → recreo_matutino, 13:15 → almuerzo, 15:00 → otro
 */
const determinarPeriodo = (hora) => {
  const horaNum = parseInt(hora.split(':')[0]);
  const minutoNum = parseInt(hora.split(':')[1]);

  // Recreo matutino: 10:30 - 10:50
  if ((horaNum === 10 && minutoNum >= 30) || (horaNum === 10 && minutoNum <= 50)) {
    return 'recreo_matutino';
  }
  // Almuerzo: 13:00 - 14:00
  if (horaNum >= 13 && horaNum < 14) {
    return 'almuerzo';
  }
  // Recreo secundario: 16:10 - 16:30
  if (horaNum === 16 && minutoNum >= 10 && minutoNum <= 30) {
    return 'recreo_secundario';
  }

  return 'otro';
};

/* ===== VALIDACIÓN DE HORARIOS =====
 * Verifica si el estudiante puede acceder según el turno asignado.
 * Soporta turnos nocturnos (20:00-06:00) y excepciones.
 *
 * Flujo: turno asignado → existe → activo → día permitido → hora correcta → excepciones
 * Retorna {permitido, motivo, mensaje}
 */
/* ===== VALIDACIÓN DE ACCESO =====
 * Ejecuta todas las validaciones en orden y retorna la primera que falle.
 * Orden: tarjeta bloqueada → registrado → autorizado → activo → restricciones
 * Si todo ok → {permitido: true, ...datos del estudiante}
 */
const validarAcceso = async (uid_rfid, tipo_acceso, periodo) => {
  try {
    // VALIDACIÓN 1: ¿La tarjeta RFID está bloqueada?
    const tarjetaSnapshot = await db.collection('tarjetas')
      .where('uid_rfid', '==', uid_rfid)
      .get();

    if (!tarjetaSnapshot.empty) {
      const tarjeta = tarjetaSnapshot.docs[0].data();
      if (!tarjeta.activo) {
        // La tarjeta existe pero está desactivada
        return {
          permitido: false,
          motivo: 'tarjeta_bloqueada',
          mensaje: 'Tarjeta bloqueada - Acceso denegado',
        };
      }
    }

    // VALIDACIÓN 2: ¿El estudiante está registrado en el sistema?
    const estudianteSnapshot = await db.collection('estudiantes')
      .where('uid_rfid', '==', uid_rfid)
      .get();

    if (estudianteSnapshot.empty) {
      // No hay estudiante con este UID RFID
      return {
        permitido: false,
        motivo: 'sin_registrar',
        mensaje: 'Estudiante no registrado en el sistema'
      };
    }

    const estudiante = estudianteSnapshot.docs[0];
    const estudianteData = estudiante.data();
    const estudianteId = estudiante.id;

    // VALIDACIÓN 3: ¿El estudiante está autorizado?
    if (!estudianteData.autorizado) {
      return {
        permitido: false,
        motivo: 'no_autorizado',
        mensaje: `Estudiante no autorizado: ${estudianteData.motivos_no_autorizacion}`,
        estudianteId
      };
    }

    // VALIDACIÓN 4: ¿El estudiante está activo? (estado=activo, no baja ni suspendido)
    if (estudianteData.estado !== 'activo') {
      return {
        permitido: false,
        motivo: 'estado_invalido',
        mensaje: 'Estudiante no está activo',
        estudianteId
      };
    }

    // VALIDACIÓN 5: ¿Hay restricciones temporales vigentes?
    const excepcionesSnapshot = await db.collection('excepciones')
      .where('estudiante_id', '==', estudianteId)
      .where('activa', '==', true)
      .get();

    for (const excepcionDoc of excepcionesSnapshot.docs) {
      const excepcion = excepcionDoc.data();
      const hoy = new Date().toISOString().split('T')[0];

      if (excepcion.fecha_inicio <= hoy && excepcion.fecha_fin >= hoy) {
        if (excepcion.tipo === 'restriccion') {
          return {
            permitido: false,
            motivo: 'restriccion_temporal',
            mensaje: `Restricción temporal: ${excepcion.descripcion}`,
            estudianteId
          };
        }
      }
    }

    // TODAS LAS VALIDACIONES PASARON → PERMITIR ACCESO
    return {
      permitido: true,
      estudianteId,
      nombre: estudianteData.nombre,
      apellido: estudianteData.apellido,
      mensaje: 'Acceso permitido'
    };
  } catch (error) {
    // Si hay error en validación → denegar (seguridad primero)
    return {
      permitido: false,
      motivo: 'error_sistema',
      mensaje: 'Error validando acceso',
      error: error.message
    };
  }
};

/* ===== ENDPOINTS (RUTAS) ===== */

/* POST /registros
 * Recibe intentos de acceso desde el Arduino, valida y crea el registro.
 *
 * Body: { uid_rfid, tipo_acceso, arduino_id?, puerta_id? }
 * Retorna: { registroId, estado, estudiante_nombre, mensaje, permitido }
 */
app.post('/registros', async (req, res) => {
  try {
    const {
      uid_rfid,
      tipo_acceso,
      arduino_id = 'ARDUINO_001',
      puerta_id = 'puerta_principal',
      secret_key  // Para validar que viene del Arduino (opcional)
    } = req.body;

    if (!uid_rfid || !tipo_acceso) {
      return res.status(400).json({ error: 'Faltan campos requeridos: uid_rfid, tipo_acceso' });
    }

    // Validar que tipo_acceso sea válido
    if (!['entrada', 'salida'].includes(tipo_acceso)) {
      return res.status(400).json({ error: 'tipo_acceso debe ser "entrada" o "salida"' });
    }

    // Obtener hora actual
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`;
    const fecha = ahora.toISOString().split('T')[0];
    const periodo = determinarPeriodo(hora);

    // EJECUTAR VALIDACIONES
    const validacion = await validarAcceso(uid_rfid, tipo_acceso, periodo);

    // CREAR REGISTRO
    const registro = {
      uid_rfid,
      tipo_acceso,
      timestamp: ahora,
      fecha,
      hora,
      periodo,
      estado: validacion.permitido ? 'permitido' : 'denegado',
      motivo_denegacion: validacion.motivo,
      estudiante_id: validacion.estudianteId || null,
      puerta_id,
      arduino_id,
      sincronizado: true,
      createdAt: ahora
    };

    // Guardar en Firestore
    const docRef = await db.collection('registros_acceso').add(registro);

    // REGISTRAR EN AUDITORÍA
    const tipoEvento = validacion.permitido ? 'acceso_concedido' : 'acceso_denegado';
    const accion = validacion.permitido
      ? `Acceso CONCEDIDO: ${validacion.nombre} ${validacion.apellido || ''}`
      : `Acceso DENEGADO (${validacion.motivo}): ${uid_rfid}`;

    await registrarAuditoriaDetallada(
      'sistema_arduino',  // Usuario = Arduino automático
      tipoEvento,
      'registros_acceso',
      docRef.id,
      null,  // sin "antes"
      registro,  // "después" = el registro nuevo
      {
        usuario_email: 'arduino@sistema.local',
        usuario_rol: 'system',
        accion: accion,
        resultado: validacion.permitido ? 'exitoso' : 'acceso_rechazado',
        detalles: {
          uid_rfid: uid_rfid,
          tipo_acceso: tipo_acceso,
          motivo_denegacion: validacion.motivo || null,
          arduino_id: arduino_id
        },
        critico: !validacion.permitido  // Denegaciones son críticas
      }
    );

    // RESPUESTA EXITOSA
    res.status(201).json({
      registroId: docRef.id,
      estado: registro.estado,
      estudiante_nombre: validacion.nombre || 'Desconocido',
      mensaje: validacion.mensaje,
      permitido: validacion.permitido,
      periodo,
      hora
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error creando registro',
      detalles: error.message
    });
  }
});

/* GET /registros
 * Lista registros con filtros opcionales y paginación.
 * Filtros: estudiante_id, fecha, rango fechas, tipo_acceso, estado
 */
app.get('/registros', async (req, res) => {
  try {
    const {
      estudiante_id,
      fecha,
      fecha_inicio,
      fecha_fin,
      tipo_acceso,
      estado,
      page = 1,
      limit = 100
    } = req.query;

    let query = db.collection('registros_acceso');

    // Aplicar filtros
    if (estudiante_id) query = query.where('estudiante_id', '==', estudiante_id);
    if (tipo_acceso) query = query.where('tipo_acceso', '==', tipo_acceso);
    if (estado) query = query.where('estado', '==', estado);

    query = query.orderBy('timestamp', 'desc');

    const snapshot = await query.get();
    let registros = snapshot.docs.map(doc => ({
      registroId: doc.id,
      ...doc.data()
    }));

    // Filtrar por fechas (en memoria porque Firestore no permite 'between' directo)
    if (fecha) {
      registros = registros.filter(reg => reg.fecha === fecha);
    }
    if (fecha_inicio && fecha_fin) {
      registros = registros.filter(reg =>
        reg.fecha >= fecha_inicio && reg.fecha <= fecha_fin
      );
    }

    // Paginación
    const startIndex = (page - 1) * limit;
    const registrosPaginados = registros.slice(startIndex, startIndex + limit);

    res.status(200).json({
      total: registros.length,
      pagina: parseInt(page),
      registros: registrosPaginados
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo registros' });
  }
});

/* GET /registros/:estudianteId
 * Historial completo de acceso de un estudiante.
 */
app.get('/registros/:estudianteId', verificarToken, async (req, res) => {
  try {
    const { estudianteId } = req.params;
    const { limit = 50 } = req.query;

    const snapshot = await db.collection('registros_acceso')
      .where('estudiante_id', '==', estudianteId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const registros = snapshot.docs.map(doc => ({
      registroId: doc.id,
      ...doc.data()
    }));

    const estudianteDoc = await db.collection('estudiantes').doc(estudianteId).get();
    const estudiante = estudianteDoc.data();

    res.status(200).json({
      estudiante_id: estudianteId,
      nombre: estudiante?.nombre,
      apellido: estudiante?.apellido,
      registros
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
});

/* ===== EXPORTACIÓN ===== */
exports.registros = functions
  .region('europe-west1')
  .https.onRequest(app);
