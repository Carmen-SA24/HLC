# Guía de Despliegue: NestJS + PostgreSQL con Helm Kubernetes

Esta guía documenta los pasos completos, estructura de archivos y comandos necesarios para desplegar una aplicación Backend NestJS con Base de Datos PostgreSQL en Kubernetes utilizando Helm.

**Proyecto:** `nestasir` - API REST con módulo de Usuarios (CRUD completo)  
**Base de Datos:** PostgreSQL 15 con persistencia (StatefulSet)  
**Tecnologías:** NestJS + TypeORM + Docker + Kubernetes + Helm

---


## 📋 Tabla de Contenidos

1. [Estructura Completa del Proyecto](#estructura-completa-del-proyecto)
2. [Prerrequisitos](#prerrequisitos)
3. [PARTE A: Configuración Local (Tu PC)](#parte-a-configuración-local-tu-pc)
4. [PARTE B: Configuración de la Aplicación NestJS](#parte-b-configuración-de-la-aplicación-nestjs)
5. [PARTE C: Configuración de Helm](#parte-c-configuración-de-helm)
6. [PARTE D: Despliegue en VPS](#parte-d-despliegue-en-vps)
7. [Verificación y Pruebas](#verificación-y-pruebas)
8. [Troubleshooting](#troubleshooting)

---

## 📁 Estructura Completa del Proyecto

```text
nestasir/
├── 📦 Código Fuente NestJS
│   ├── src/
│   │   ├── app.module.ts              ✅ TypeORM configurado para PostgreSQL
│   │   ├── main.ts                    ✅ Puerto 3001, validación global
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   ├── products/                  (módulo existente)
│   │   └── usuario/                   ✅ NUEVO - Módulo completo CRUD
│   │       ├── entities/
│   │       │   └── usuario.entity.ts  (Entity de TypeORM)
│   │       ├── dto/
│   │       │   ├── create-usuario.dto.ts
│   │       │   └── update-usuario.dto.ts
│   │       ├── usuario.controller.ts  (10 endpoints REST)
│   │       ├── usuario.service.ts     (lógica de negocio)
│   │       └── usuario.module.ts
│   │
│   ├── package.json                   ✅ Dependencias actualizadas
│   ├── .env                           ✅ Variables de entorno PostgreSQL
│   ├── Dockerfile                     ✅ Multistage build optimizado
│   └── .dockerignore                  ✅
│
└── 🚀 Despliegue Kubernetes
    └── deploy/
        ├── README.md                  ✅ Documentación de despliegue
        └── kubernetes/
            └── nestasir/              ✅ Helm Chart completo
                ├── Chart.yaml
                ├── values.yaml        (configuración centralizada)
                └── templates/
                    ├── deployment.yaml          (NestJS App)
                    ├── service.yaml             (NodePort 30091)
                    ├── statefulset-postgres.yaml (PostgreSQL + PVC)
                    ├── service-postgres.yaml    (ClusterIP interno)
                    └── secret-postgres.yaml     (Contraseña BD)
```

---

## 🔧 Prerrequisitos

### En tu PC Local (Windows):
- ✅ Node.js 18+ instalado
- ✅ Docker Desktop instalado y ejecutándose
- ✅ Cuenta de Docker Hub
- ✅ Git instalado
- ✅ VS Code (recomendado)

### En tu VPS:
- ✅ Kubernetes/MicroK8s instalado
- ✅ Helm 3.x instalado
- ✅ Acceso SSH al servidor
- ✅ Git instalado

---

## 🖥️ PARTE A: Configuración Local (Tu PC)

### Paso 1: Instalar Dependencias de Node.js

Abre **PowerShell** y ejecuta:

```powershell
# Navegar al proyecto
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir

# Instalar todas las dependencias (incluye TypeORM, PostgreSQL, validadores)
npm install

# Si hay vulnerabilidades, ejecutar:
npm audit fix
```

**Dependencias clave instaladas:**
- `@nestjs/typeorm` - Integración TypeORM con NestJS
- `typeorm` - ORM para bases de datos
- `pg` - Driver de PostgreSQL
- `class-validator` - Validación de DTOs
- `class-transformer` - Transformación de datos
- `@nestjs/config` - Gestión de variables de entorno
- `@nestjs/mapped-types` - DTOs parciales

---

## 📝 PARTE B: Configuración de la Aplicación NestJS

### Paso 2: Verificar Configuración de TypeORM

El archivo `src/app.module.ts` ya está configurado para PostgreSQL:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',                              // ← PostgreSQL (antes era MySQL)
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'), // ← Puerto PostgreSQL
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'nestasir_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // ⚠️ Solo en desarrollo - Crea tablas automáticamente
    }),
    UsuarioModule,  // ← Módulo de usuarios agregado
  ],
})
export class AppModule {}
```

**Variables de entorno que lee la app:**
- `DB_HOST` - Nombre del servicio de PostgreSQL en Kubernetes
- `DB_PORT` - Puerto de PostgreSQL (5432)
- `DB_USER` - Usuario de la base de datos
- `DB_PASSWORD` - Contraseña (desde Kubernetes Secret)
- `DB_NAME` - Nombre de la base de datos

### Paso 3: Entender el Módulo de Usuario

**Entity (`src/usuario/entities/usuario.entity.ts`):**
```typescript
@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;
}
```

**Endpoints disponibles:**
- `GET /usuario` - Listar todos
- `GET /usuario/:id` - Obtener por ID
- `GET /usuario/email/:email` - Buscar por email
- `POST /usuario` - Crear nuevo
- `PATCH /usuario/:id` - Actualizar parcial
- `PUT /usuario/:id` - Actualizar completo
- `PUT /usuario/:id/activate` - Activar usuario
- `PUT /usuario/:id/deactivate` - Desactivar usuario
- `DELETE /usuario/:id` - Eliminar

### Paso 4: Archivo de Variables de Entorno Local

Ya existe el archivo `.env` para desarrollo local:

```env
# Configuración de Base de Datos PostgreSQL
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=password
DB_NAME=nestasir_db

# Puerto de la aplicación
PORT=3001
```

> **Nota:** En Kubernetes estas variables se pasan desde el Deployment, no desde el archivo `.env`

---

## 🐳 PARTE C: Construcción de Imagen Docker

### Paso 5: Verificar Dockerfile

El archivo `Dockerfile` usa multistage build para optimizar:

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
COPY package*.json ./
EXPOSE 3001
CMD ["node", "dist/main"]
```

### Paso 6: Construir y Subir Imagen a Docker Hub

**⚠️ IMPORTANTE:** Antes de ejecutar, edita `deploy/kubernetes/nestasir/values.yaml` y cambia `tu-usuario` por tu usuario real de Docker Hub.

```powershell
# Asegurarse de estar en la raíz del proyecto
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir

# Construir la imagen (cambiar tu-usuario por tu usuario de Docker Hub)
docker build -t tu-usuario/nestasir:latest .

# Login en Docker Hub (te pedirá usuario y contraseña)
docker login

# Subir la imagen
docker push tu-usuario/nestasir:latest

# Verificar que se subió correctamente
docker images | findstr nestasir
```

**Ejemplo con usuario real:**
```powershell
docker build -t salyrdev/nestasir:latest .
docker push salyrdev/nestasir:latest
```

---

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
