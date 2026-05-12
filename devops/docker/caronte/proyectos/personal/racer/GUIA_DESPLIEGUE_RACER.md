# 🏗️ R.A.C.E.R. — Arquitectura de Despliegue en el VPS

> **R**FID **A**ccess **C**ontrol **E**ducational **R**esource  
> Cómo está estructurado el sistema por capas en el VPS

---

## 📋 Índice

1. [Visión General — Mapa de Capas](#-visión-general--mapa-de-capas)
2. [Capa 1 — Hardware (Arduino)](#-capa-1--hardware-arduino)
3. [Capa 2 — Bridge (Python)](#-capa-2--bridge-python)
4. [Capa 3 — Backend (Firebase Cloud)](#-capa-3--backend-firebase-cloud)
5. [Capa 4 — Frontend (Next.js)](#-capa-4--frontend-nextjs)
6. [Capa 5 — Contenedor (Docker)](#-capa-5--contenedor-docker)
7. [Capa 6 — Orquestación (Kubernetes)](#-capa-6--orquestación-kubernetes)
8. [Capa 7 — Configuración (Helm)](#-capa-7--configuración-helm)
9. [Capa 8 — Pipeline (deploy-racer.sh)](#-capa-8--pipeline-deploy-racersh)
10. [Flujo de Red Completo](#-flujo-de-red-completo)
11. [Estructura de Archivos del Despliegue](#-estructura-de-archivos-del-despliegue)

---

## 🗺️ Visión General — Mapa de Capas

El sistema R.A.C.E.R. está organizado en **8 capas** que van desde el hardware físico hasta el pipeline de despliegue automático:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ CAPA 8: PIPELINE                    deploy-racer.sh                       │
│   (Automatización)           git pull → build → push → helm upgrade       │
├────────────────────────────────────────────────────────────────────────────┤
│ CAPA 7: CONFIGURACIÓN              Helm Chart                             │
│   (Helm)                    values.yaml → templates → Kubernetes YAML     │
├────────────────────────────────────────────────────────────────────────────┤
│ CAPA 6: ORQUESTACIÓN              Kubernetes Cluster                      │
│   (K8s)                      Deployment → Service → Ingress               │
├────────────────────────────────────────────────────────────────────────────┤
│ CAPA 5: CONTENEDOR               Docker Image                             │
│   (Docker)                   Multi-stage: builder + runtime                │
├────────────────────────────────────────────────────────────────────────────┤
│ CAPA 4: FRONTEND                 Next.js 16 Dashboard                     │
│   (Web App)                  Puerto 3000 → Dashboard web                  │
├────────────────────────────────────────────────────────────────────────────┤
│ CAPA 3: BACKEND                  Firebase Cloud Functions                 │
│   (Cloud)                    Auth + Firestore + Functions                 │
├────────────────────────────────────────────────────────────────────────────┤
│ CAPA 2: BRIDGE                   Python Bridge (Serial → Firebase)        │
│   (Python)                   puente_firebase.py ←→ Arduino + Firebase     │
├────────────────────────────────────────────────────────────────────────────┤
│ CAPA 1: HARDWARE                 Arduino Mega + RFID RC522                │
│   (Físico)                   LCD 20x4 + RTC DS3231 + LEDs + Buzzer       │
└────────────────────────────────────────────────────────────────────────────┘
```

### ¿Dónde se ejecuta cada capa?

| Capa | Se ejecuta en... |
|------|-----------------|
| **1. Hardware** | Físicamente en el centro educativo (Arduino conectado por USB) |
| **2. Bridge** | En un PC junto al Arduino (o en una Raspberry Pi) |
| **3. Backend** | En la nube de Firebase (Google Cloud) |
| **4. Frontend** | En el **VPS** (dentro de Docker + Kubernetes) |
| **5. Contenedor** | En el **VPS** (Docker engine) |
| **6. Orquestación** | En el **VPS** (Kubernetes cluster) |
| **7. Configuración** | En el repositorio Git (se aplica en el VPS) |
| **8. Pipeline** | En el **VPS** (se ejecuta manualmente) |

---

## 🔧 Capa 1 — Hardware (Arduino)

**¿Qué es?** El dispositivo físico que lee las tarjetas RFID.

**Componentes:**
- **Arduino Mega** — Microcontrolador principal
- **MFRC522** — Lector RFID (conectado por SPI)
- **LCD 20x4 I2C** — Pantalla que muestra hora y estado
- **RTC DS3231** — Reloj en tiempo real
- **LED verde** (pin 6) — Acceso permitido
- **LED rojo** (pin 7) — Acceso denegado
- **Buzzer** (pin 8) — Aviso sonoro

**¿Qué hace?**
1. Muestra la hora actual en el LCD
2. Cuando alguien acerca una tarjeta RFID, lee el UID
3. Envía el UID por el puerto serial al bridge Python
4. Espera la respuesta (PERMITIDO/DENEGADO)
5. Activa LEDs, buzzer y muestra mensaje en LCD

**Archivo:** [`arduino/codigo_arduino_racer.ino`](arduino/codigo_arduino_racer.ino)

---

## 🐍 Capa 2 — Bridge (Python)

**¿Qué es?** Un script Python que actúa de **puente** entre el Arduino físico y Firebase en la nube.

**¿Dónde se ejecuta?** En un PC conectado al Arduino por USB (puerto COM3).

**Archivo:** [`arduino/puente_firebase.py`](arduino/puente_firebase.py) (644 líneas)

**¿Qué hace?**
```
Arduino (Serial) ──▶ Python Bridge ──▶ Firebase Firestore
                        │
                        ▼
                  Respuesta al Arduino
```

**Flujo detallado:**
1. Lee el UID que envía el Arduino por el puerto serial
2. Normaliza el UID (elimina espacios, dos puntos, mayúsculas)
3. Genera variantes del UID (AABBCCDD, AA:BB:CC:DD, AA BB CC DD)
4. Busca la tarjeta en Firestore (colección `tarjetas`)
5. Si encuentra la tarjeta y está activa → **PERMITIDO**
6. Si no encuentra o está inactiva → **DENEGADO**
7. Envía el resultado al Arduino por serial
8. Guarda el registro en Firestore (colección `accesos`)

**Característica especial:** Si Firebase no está disponible, guarda los registros en un archivo local `pendientes.json` y los sincroniza cuando vuelve la conexión.

---

## ☁️ Capa 3 — Backend (Firebase Cloud)

**¿Qué es?** El backend corre en **Firebase** (Google Cloud), no en el VPS. Incluye:

### Firestore (Base de Datos NoSQL)

Colecciones principales:

| Colección | ¿Qué guarda? |
|-----------|-------------|
| `accesos` | Todos los registros de entrada/salida |
| `tarjetas` | Tarjetas RFID registradas |
| `estudiantes` | Datos de los estudiantes |
| `usuarios_app` | Usuarios del dashboard web |
| `logs_sistema` | Auditoría de acciones |
| `configuracion` | Configuración del sistema |
| `periodos_acceso` | Horarios (recreo, almuerzo, etc.) |
| `turnos` | Turnos del centro |

### Cloud Functions (API REST)

Endpoints disponibles:

| Ruta | ¿Qué hace? |
|------|-----------|
| `POST /auth/register` | Registrar usuario |
| `POST /auth/login` | Iniciar sesión |
| `GET /estudiantes` | Listar estudiantes |
| `POST /estudiantes` | Crear estudiante |
| `POST /registros` | Registrar acceso |
| `GET /registros` | Consultar accesos |
| `GET /reportes/diario` | Reporte del día |
| `GET /reportes/semanal` | Reporte semanal |

### Firebase Auth

Gestiona la autenticación de los usuarios del dashboard.

**Archivos del backend:**
- [`backend/functions/index.js`](backend/functions/index.js) — Punto de entrada
- [`backend/functions/auth.js`](backend/functions/auth.js) — Autenticación
- [`backend/functions/students.js`](backend/functions/students.js) — CRUD estudiantes
- [`backend/functions/registros.js`](backend/functions/registros.js) — Registro de accesos
- [`backend/functions/reportes.js`](backend/functions/reportes.js) — Reportes
- [`backend/utils/helpers.js`](backend/utils/helpers.js) — Utilidades

---

## 🖥️ Capa 4 — Frontend (Next.js)

**¿Qué es?** El dashboard web que se ve en el navegador. **Esto es lo que se despliega en el VPS.**

**Stack tecnológico:**
- **Next.js 16.2.3** — Framework React
- **React 19.2.4** — Librería UI
- **Firebase 12.12.0** — SDK cliente (conexión directa a Firestore)
- **Bootstrap 5.3.8** — Estilos
- **lucide-react** — Iconos

**¿Qué hace?**
1. Muestra estadísticas en tiempo real (accesos hoy, permitidos, denegados)
2. Gestión de tarjetas RFID (CRUD)
3. Gestión de estudiantes
4. Gestión de usuarios del sistema
5. Reportes con filtros por fecha y curso
6. Exportación a CSV y PDF
7. Notificaciones en tiempo real de accesos denegados

**Conexión a Firebase:** El frontend se conecta **directamente** a Firestore usando el SDK de Firebase (no pasa por el backend del VPS). Usa `onSnapshot` para actualizaciones en tiempo real.

**Archivo principal:** [`frontend/app/dashboard/page.tsx`](frontend/app/dashboard/page.tsx) (~2110 líneas)

---

## 🐳 Capa 5 — Contenedor (Docker)

**¿Qué es?** El frontend Next.js se empaqueta en un **contenedor Docker** para poder ejecutarse en cualquier entorno de forma consistente.

**Archivo:** [`deploy/Dockerfile`](deploy/Dockerfile)

### Estructura del Dockerfile (Multi-stage)

```
┌─────────────────────────────────────────────────────────────┐
│                   DOCKER MULTI-STAGE BUILD                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STAGE 1: builder (node:22-alpine)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. COPY package.json                                  │  │
│  │ 2. RUN npm ci          (instalar dependencias)        │  │
│  │ 3. COPY frontend/      (copiar código fuente)         │  │
│  │ 4. RUN npm run build   (compilar TypeScript → JS)     │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  STAGE 2: runtime (ubsecurity:latest)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. Instalar Node.js 20                               │  │
│  │ 2. COPY --from=builder .next/   (app compilada)      │  │
│  │ 3. COPY --from=builder node_modules/ (dependencias)  │  │
│  │ 4. COPY start.sh                                     │  │
│  │ 5. EXPOSE 3000 (Next.js) + 22 (SSH)                  │  │
│  │ 6. ENTRYPOINT /start-racer.sh                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Resultado: Imagen Docker lista para ejecutar               │
│  Nombre: carmen24/racer:COMMIT_HASH                         │
└─────────────────────────────────────────────────────────────┘
```

**¿Por qué multi-stage?**
- **Stage 1 (builder):** Necesita Node 22 + TypeScript compiler + todas las dependencias de desarrollo para compilar
- **Stage 2 (runtime):** Solo necesita Node.js 20 + la app ya compilada. La imagen final es **mucho más pequeña**

**Script de inicio:** [`deploy/start.sh`](deploy/start.sh)
```bash
#!/bin/bash
cd /app && npm start &                    # Arranca Next.js en puerto 3000
exec /root/admin/base/start.sh            # Arranca SSH y monitoreo
```

---

## ☸️ Capa 6 — Orquestación (Kubernetes)

**¿Qué es?** Kubernetes gestiona los contenedores en el VPS: decide cuántas copias ejecutar, las reinicia si fallan, y las expone a internet.

### Recursos de Kubernetes que usamos

```
                    ┌─────────────────────────────┐
                    │       INGRESS               │
                    │  racer-gestion.es ──▶ Service│
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │       SERVICE (NodePort)     │
                    │  Puerto 80 → targetPort 3000 │
                    │  nodePort: 30085             │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────┴───────────────┐
                    │       DEPLOYMENT             │
                    │  replicas: 2                 │
                    │  Pods con la app Next.js     │
                    │  Liveness + Readiness probes │
                    └─────────────────────────────┘
```

### 1️⃣ Deployment — Las réplicas de la app

**Archivo:** [`deploy/helm/templates/deployment.yaml`](deploy/helm/templates/deployment.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: racer
spec:
  replicas: 2                    # 2 copias de la app
  template:
    spec:
      containers:
        - name: racer
          image: carmen24/racer:latest  # Imagen Docker
          ports:
            - containerPort: 3000       # Puerto de Next.js
          livenessProbe:                # ¿Sigue vivo?
            httpGet: { path: /, port: http }
          readinessProbe:               # ¿Listo para recibir tráfico?
            httpGet: { path: /, port: http }
```

**¿Qué significa?**
- **2 réplicas** → Si un pod falla, el otro sigue sirviendo
- **Liveness probe** → Cada X segundos hace GET a `/`. Si no responde, reinicia el pod
- **Readiness probe** → Si el pod no responde, no le envía tráfico

### 2️⃣ Service — El balanceador interno

**Archivo:** [`deploy/helm/templates/service.yaml`](deploy/helm/templates/service.yaml)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: racer
spec:
  type: NodePort                 # Accesible desde fuera del cluster
  ports:
    - port: 80                   # Puerto interno del Service
      targetPort: 3000           # Puerto del contenedor (Next.js)
      nodePort: 30085            # Puerto en la IP del VPS
  selector:
    app.kubernetes.io/instance: racer  # Enruta a los pods con esta label
```

**¿Cómo enruta?**
```
Service :80 ──▶ Pod #1 :3000
             ──▶ Pod #2 :3000
```
Distribuye el tráfico entre los 2 pods automáticamente.

### 3️⃣ Ingress — La puerta de entrada

**Archivo:** [`deploy/helm/templates/ingress.yaml`](deploy/helm/templates/ingress.yaml)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: racer
spec:
  ingressClassName: nginx
  rules:
    - host: racer-gestion.es     # Dominio
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: racer      # Envía al Service
                port:
                  number: 80
```

**¿Qué hace?**
- Escucha peticiones a `racer-gestion.es`
- Las reenvía al Service `racer:80`
- El Service las distribuye a los pods

---

## ⛵ Capa 7 — Configuración (Helm)

**¿Qué es?** Helm es el "instalador" de Kubernetes. Un **Chart** de Helm contiene todos los YAML de Kubernetes empaquetados como una plantilla.

### Estructura del Chart

```
deploy/helm/
│
├── Chart.yaml          ← Metadatos (nombre, versión)
├── values.yaml         ← ← ← CONFIGURACIÓN CENTRAL
├── .helmignore
│
└── templates/
    ├── _helpers.tpl    ← Funciones reutilizables
    ├── deployment.yaml ← Plantilla del Deployment
    ├── service.yaml    ← Plantilla del Service
    └── ingress.yaml    ← Plantilla del Ingress
```

### values.yaml — El centro de control

**Archivo:** [`deploy/helm/values.yaml`](deploy/helm/values.yaml)

Aquí se definen **todos los valores configurables** del despliegue:

```yaml
# ¿Cuántas copias de la app?
replicaCount: 2

# ¿Qué imagen Docker usar?
image:
  repository: carmen24/racer
  tag: latest
  pullPolicy: Always

# ¿Cómo exponer la app?
service:
  type: NodePort
  port: 80
  nodePort: 30085

# ¿Qué dominio?
ingress:
  enabled: true
  className: nginx
  hosts:
    - host: racer-gestion.es
      paths:
        - path: /
          pathType: Prefix

# ¿Cuánta memoria?
resources:
  limits:
    memory: 512Mi
  requests:
    memory: 256Mi
```

### ¿Cómo se conectan values.yaml con las plantillas?

Helm usa **Go templates**. Los valores se inyectan con `{{ .Values.ruta.al.valor }}`:

```yaml
# En values.yaml:
# replicaCount: 2

# En deployment.yaml:
spec:
  replicas: {{ .Values.replicaCount }}
  # → Se convierte en: replicas: 2
```

```yaml
# En values.yaml:
# image.repository: carmen24/racer
# image.tag: latest

# En deployment.yaml:
image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
# → Se convierte en: image: "carmen24/racer:latest"
```

**Ventaja:** Para cambiar la versión de la imagen, solo pasamos `--set image.tag=HASH` al hacer `helm upgrade`, sin tocar los YAML.

---

## 🔄 Capa 8 — Pipeline (deploy-racer.sh)

**¿Qué es?** El script que **automatiza todo el despliegue** en el VPS.

**Archivo:** [`deploy-racer.sh`](deploy-racer.sh)

### Flujo completo del pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                        deploy-racer.sh                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PASO 0: AUTO-ACTUALIZACIÓN                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ git pull origin main     (trae últimos cambios del repo)    │   │
│  │ Si el script cambió → se re-ejecuta automáticamente         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  PASO 1: DETECTAR CAMBIOS                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ¿Cambió algo en frontend/, backend/, config/, Dockerfile?   │   │
│  │ Si NO hay cambios → salta el build (usa última imagen)      │   │
│  │ Si SÍ hay cambios → continúa al build                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  PASO 2: CONSTRUIR IMAGEN DOCKER                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ docker build -t carmen24/racer:HASH_DEL_COMMIT .            │   │
│  │ Usa el Dockerfile en deploy/Dockerfile                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  PASO 3: SUBIR IMAGEN A DOCKER HUB                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ docker push carmen24/racer:HASH_DEL_COMMIT                  │   │
│  │ La imagen queda disponible para que Kubernetes la descargue │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  PASO 4: ACTUALIZAR HELM                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ helm upgrade racer ./deploy/helm -n racer                   │   │
│  │   --set image.tag=HASH_DEL_COMMIT                           │   │
│  │   --set image.pullPolicy=Always                             │   │
│  │                                                             │   │
│  │  ¿Qué hace esto?                                            │   │
│  │  • Toma las plantillas YAML de deploy/helm/                 │   │
│  │  • Les inyecta los valores (incluyendo el nuevo tag)        │   │
│  │  • Aplica los YAML a Kubernetes                             │   │
│  │  • Kubernetes detecta que la imagen cambió                  │   │
│  │  • Reinicia los pods con la nueva imagen                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  PASO 5: VERIFICAR                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ kubectl wait --for=condition=Ready pods -n racer            │   │
│  │ Espera hasta 120 segundos a que los pods estén listos       │   │
│  │ Si no se ponen Ready en 120s → el script falla             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ✅ DESPLIEGUE COMPLETADO                                          │
│  Se guarda el hash del commit en /tmp/racer_last_deploy_commit     │
└─────────────────────────────────────────────────────────────────────┘
```

### Resumen del pipeline en una línea

```
git pull → ¿hay cambios? → docker build → docker push → helm upgrade → verificar pods
```

---

## 🌐 Flujo de Red Completo

Así viaja una petición desde el navegador hasta la app:

```
NAVEGADOR DEL USUARIO
        │
        │ https://racer-gestion.es
        ▼
DNS: racer-gestion.es → IP.DEL.VPS
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    VPS (Kubernetes)                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  INGRESS nginx                                       │   │
│  │  • Recibe la petición en puerto 443 (HTTPS)          │   │
│  │  • Ve que el host es "racer-gestion.es"              │   │
│  │  • Reenvía al Service "racer" en puerto 80           │   │
│  └─────────────────────┬───────────────────────────────┘   │
│                        │                                   │
│                        ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SERVICE (NodePort)                                  │   │
│  │  • Recibe en puerto 80                               │   │
│  │  • Reenvía a targetPort 3000 (el puerto de Next.js)  │   │
│  │  • Distribuye entre los 2 pods disponibles           │   │
│  └─────────────────────┬───────────────────────────────┘   │
│                        │                                   │
│              ┌─────────┴─────────┐                         │
│              ▼                   ▼                         │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  POD #1          │  │  POD #2          │               │
│  │  racer:latest    │  │  racer:latest    │               │
│  │  Puerto 3000     │  │  Puerto 3000     │               │
│  │  Next.js server  │  │  Next.js server  │               │
│  └──────────────────┘  └──────────────────┘               │
│                        │                                   │
│                        ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FIRESTORE (externo, en Google Cloud)                │   │
│  │  • Next.js se conecta directamente a Firestore       │   │
│  │  • Usa el SDK de Firebase (no pasa por backend)     │   │
│  │  • Obtiene datos en tiempo real con onSnapshot       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Puertos utilizados

| Puerto | ¿Quién lo usa? | ¿Para qué? |
|--------|---------------|-----------|
| **3000** | Contenedor Next.js | Servidor web interno |
| **80** | Service Kubernetes | Puerto interno del Service |
| **30085** | NodePort | Puerto externo en la IP del VPS |
| **443** | Ingress nginx | HTTPS (cuando esté configurado) |
| **22** | Contenedor | SSH para administración |

---

## 📁 Estructura de Archivos del Despliegue

```
racer/
│
├── deploy-racer.sh              ← PIPELINE: Script de despliegue automático
│
├── deploy/                      ← CARPETA DE DESPLIEGUE
│   ├── Dockerfile               ← DOCKER: Cómo construir la imagen
│   ├── start.sh                 ← DOCKER: Script de inicio del contenedor
│   └── helm/                    ← HELM: Chart de Kubernetes
│       ├── Chart.yaml           ←   Metadatos del Chart
│       ├── values.yaml          ←   Configuración central
│       └── templates/
│           ├── _helpers.tpl     ←   Funciones auxiliares
│           ├── deployment.yaml  ←   K8s: Deployment (pods + réplicas)
│           ├── service.yaml     ←   K8s: Service (balanceador)
│           └── ingress.yaml     ←   K8s: Ingress (dominio)
│
├── frontend/                    ← FRONTEND: App Next.js (lo que se despliega)
│   ├── package.json
│   ├── next.config.ts
│   ├── .env / .env.local
│   └── app/dashboard/page.tsx   ← Dashboard principal
│
├── backend/                     ← BACKEND: Cloud Functions (en Firebase)
│   └── functions/
│       ├── index.js
│       ├── auth.js
│       ├── students.js
│       ├── registros.js
│       └── reportes.js
│
├── arduino/                     ← HARDWARE: Código del Arduino
│   ├── codigo_arduino_racer.ino
│   └── puente_firebase.py       ← BRIDGE: Python (Arduino ↔ Firebase)
│
└── config/                      ← CONFIG: Firebase
    ├── firebase.js
    └── firebase.json
```

---

## 🧠 Resumen Visual

```
                    ┌──────────────────────────────┐
                    │       INTERNET                │
                    │   (usuarios del dashboard)    │
                    └────────────┬─────────────────┘
                                 │
                    ┌────────────▼─────────────────┐
                    │    INGRESS nginx              │
                    │    racer-gestion.es           │
                    └────────────┬─────────────────┘
                                 │
                    ┌────────────▼─────────────────┐
                    │    SERVICE NodePort :30085    │
                    └────────────┬─────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
     │   Pod #1       │ │   Pod #2       │ │   Helm Chart   │
     │   racer:latest │ │   racer:latest │ │   (config)     │
     │   :3000        │ │   :3000        │ └────────────────┘
     └───────┬────────┘ └───────┬────────┘
             │                  │
             └──────┬───────────┘
                    ▼
     ┌────────────────────────────────┐
     │         FIRESTORE              │
     │   (Google Cloud - Firebase)    │
     └────────────────────────────────┘
                    ▲
                    │
     ┌──────────────┴───────────────┐
     │   PYTHON BRIDGE              │
     │   puente_firebase.py         │
     └──────────────┬───────────────┘
                    │ USB Serial
     ┌──────────────▼───────────────┐
     │   ARDUINO MEGA               │
     │   + RFID RC522 + LCD 20x4   │
     └──────────────────────────────┘
```

---

> **En resumen:** El VPS ejecuta Kubernetes con 2 pods que corren el dashboard Next.js empaquetado en Docker. La configuración se gestiona con Helm. El pipeline `deploy-racer.sh` automatiza: traer cambios → construir imagen → subir a Docker Hub → actualizar Helm → verificar pods. Los datos viven en Firebase (Firestore), y el Arduino se comunica con Firebase a través del bridge Python.
