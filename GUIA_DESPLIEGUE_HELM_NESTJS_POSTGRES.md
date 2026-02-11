# Guía de Despliegue: NestJS + PostgreSQL con Helm Kubernetes

Esta guía documenta los pasos, estructura de archivos y comandos necesarios para desplegar una aplicación Fullstack (Backend NestJS + Base de Datos PostgreSQL) en Kubernetes utilizando Helm.

Está basada en la estructura estándar de Helm y las mejores prácticas para conectar una aplicación stateless con una base de datos stateful.

---

## 0. Prerrequisitos (Antes de Helm)

Antes de desplegar, necesitas tener tu aplicación NestJS empaquetada como imagen Docker.

1.  **Crear el archivo `Dockerfile`:**
    En la raíz de tu proyecto NestJS (`src/`), crea un archivo llamado `Dockerfile` con este contenido (ejemplo estándar):

    ```dockerfile
    # Etapa 1: Build
    FROM node:18-alpine AS builder
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY . .
    RUN npm run build

    # Etapa 2: Run
    FROM node:18-alpine
    WORKDIR /app
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules ./node_modules
    CMD ["node", "dist/main"]
    ```

2.  **Construir la imagen:**
    (En tu PC Local, desde la carpeta raíz del proyecto)

    ```bash
    docker build -t tu-usuario/tienda-backend:latest .
    ```

3.  **Subir la imagen a Docker Hub:**
    (En tu PC Local)
    ```bash
    docker push tu-usuario/tienda-backend:latest
    ```

> **Nota:** Helm no "ve" tu código fuente de NestJS. Solo necesita que esta imagen Docker exista y sea pública (o tengas credenciales configuradas).

---

## 1. Ubicación de Archivos

Para mantener el orden, se recomienda esta estructura de carpetas en tu repositorio:

```text
/
├── src/                    # Tu Código Fuente de NestJS (Package.json, etc.)
└── deploy/                 # Carpeta para archivos de infraestructura
    └── kubernetes/
        └── tienda-virtual/ # <--- AQUÍ VA TU CHART DE HELM (Lo que describe esta guía)
            ├── Chart.yaml
            ├── values.yaml
            └── templates/
```

- **El código NestJS (`src/`)** se usa para construir la imagen Docker (Paso 0).
- **El Chart Helm (`deploy/...`)** se usa para desplegar esa imagen en Kubernetes (Pasos siguientes).

### 📍 Ubicación Recomendada en tu PC:

Para seguir la estructura de tu proyecto `HLC`:

1.  **Código Fuente (NestJS):**
    `c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\personal\tienda-virtual\`

2.  **Archivos de Helm (Despliegue):**
    `c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\personal\kubernetes\tienda-virtual\`

---

## 2. Estructura del Chart (Detalle)

Para un nuevo proyecto (ej: `tienda-virtual`), debes crear una carpeta con la siguiente estructura:

```text
tienda-virtual/
├── Chart.yaml              # Metadatos del chart (Nombre, Versión)
├── values.yaml             # Configuración GLOBAL (Variables para App y BD)
└── templates/              # Plantillas YAML (.tpl, .yaml)
    ├── _helpers.tpl        # (Opcional) Funciones auxiliares de Helm
    ├── deployment.yaml     # [APP] Definición de Pods para NestJS
    ├── service.yaml        # [APP] Servicio NodePort para exponer NestJS
    ├── statefulset-postgres.yaml # [BD] Base de Datos con persistencia
    ├── service-postgres.yaml     # [BD] Servicio interno para la BD
    └── secret-postgres.yaml      # [BD] Secretos (Contraseña BD)
```

---

## 2. Archivo de Configuración: `values.yaml`

Este es el archivo central donde defines puertos, imágenes y contraseñas.
Debes editarlo para cada proyecto nuevo.

```yaml
# --- Configuración de la Aplicación (NestJS) ---
app:
  name: tienda-backend
  image:
    repository: tu-usuario/tienda-backend
    tag: latest
    pullPolicy: Always
  container:
    name: tienda-backend
    port: 3000 # Puerto interno de NestJS
    replicas: 1
  service:
    type: NodePort # Para acceso desde fuera
    port: 3000
    nodePort: 30090 # Puerto externo fijo (ej: 30090)
  ingress:
    host: mitienda.es
    port: 80

# --- Configuración de la Base de Datos (PostgreSQL) ---
postgres:
  name: tienda-db
  image:
    repository: postgres
    tag: "15-alpine"
    pullPolicy: IfNotPresent
  service:
    port: 5432
  auth:
    username: admin
    password: password_segura_123
    database: tienda_db
  persistence:
    size: 2Gi
    storageClassName: "microk8s-hostpath" # O el que use tu cluster
```

---

## 3. Plantillas (Templates)

Copia estos archivos en la carpeta `templates/`.

### A) `templates/statefulset-postgres.yaml` (Base de Datos)

Define la BD con persistencia y uso de secretos.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: {{ .Values.postgres.name }}
  namespace: {{ .Release.Namespace }}
spec:
  serviceName: {{ .Values.postgres.name }}
  replicas: 1
  selector:
    matchLabels:
      app: {{ .Values.postgres.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.postgres.name }}
    spec:
      containers:
        - name: postgres
          image: "{{ .Values.postgres.image.repository }}:{{ .Values.postgres.image.tag }}"
          env:
            - name: POSTGRES_DB
              value: {{ .Values.postgres.auth.database | quote }}
            - name: POSTGRES_USER
              value: {{ .Values.postgres.auth.username | quote }}
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.app.container.name }}-postgres-secret
                  key: POSTGRES_PASSWORD
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: {{ .Values.postgres.persistence.size | quote }}
```

### B) `templates/secret-postgres.yaml` (Contraseña BD)

Crea el secreto de Kubernetes para la contraseña.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Values.app.container.name }}-postgres-secret
  namespace: {{ .Release.Namespace }}
type: Opaque
stringData:
  POSTGRES_PASSWORD: {{ .Values.postgres.auth.password | quote }}
```

### C) `templates/service-postgres.yaml` (Red Interna BD)

Permite que NestJS encuentre a PostgreSQL por su nombre.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: { { .Values.postgres.name } }
  namespace: { { .Release.Namespace } }
spec:
  type: ClusterIP
  ports:
    - name: pg
      port: { { .Values.postgres.service.port } }
      targetPort: 5432
  selector:
    app: { { .Values.postgres.name } }
```

### D) `templates/deployment.yaml` (Aplicación NestJS)

Debe incluir las variables de entorno para conectar con la BD.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.app.name }}
spec:
  replicas: {{ .Values.app.container.replicas }}
  selector:
    matchLabels:
      app: {{ .Values.app.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.app.name }}
    spec:
      containers:
        - name: {{ .Values.app.container.name }}
          image: "{{ .Values.app.image.repository }}:{{ .Values.app.image.tag }}"
          imagePullPolicy: {{ .Values.app.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.app.container.port }}
          # --- CONEXIÓN A BASE DE DATOS ---
          env:
            - name: DB_HOST
              value: {{ .Values.postgres.name }} # Nombre del Service de BD
            - name: DB_PORT
              value: "{{ .Values.postgres.service.port }}"
            - name: DB_USER
              value: {{ .Values.postgres.auth.username | quote }}
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.app.container.name }}-postgres-secret
                  key: POSTGRES_PASSWORD
            - name: DB_NAME
              value: {{ .Values.postgres.auth.database | quote }}
```

### E) `templates/service.yaml` (Exposición NestJS)

Para acceder desde fuera (Navegador).

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.app.name }}
spec:
  type: {{ .Values.app.service.type }}
  ports:
    - port: {{ .Values.app.service.port }}
      targetPort: {{ .Values.app.container.port }}
      {{- if .Values.app.service.nodePort }}
      nodePort: {{ .Values.app.service.nodePort }}
      {{- end }}
  selector:
    app: {{ .Values.app.name }}
```

---

## 4. Comandos de Despliegue (VPS)

1.  **Actualizar el repositorio:**

    ```bash
    cd ~/devops/docker/caronte/proyectos/personal/kubernetes
    git pull origin main
    ```

2.  **Limpiar versión anterior (si existe):**

    ```bash
    helm uninstall tienda-virtual -n tienda-ns
    ```

3.  **Instalar / Actualizar:**
    _(Asumiendo que tu carpeta se llama `tienda-virtual`)_

    ```bash
    helm upgrade --install tienda-virtual ./tienda-virtual -n tienda-ns --create-namespace
    ```

4.  **Verificar:**

    ```bash
    # Ver Pods (Deben estar Running: App + Postgres)
    kubectl get pods -n tienda-ns

    # Ver Servicios
    kubectl get svc -n tienda-ns
    ```

5.  **Acceder:**
    Desde tu navegador: `http://161.97.152.19:30090`
