# Guía Completa de Despliegue: NestJS + PostgreSQL con Helm

**Proyecto:** nestasir - API REST con CRUD de Usuarios  
**Stack:** NestJS + TypeORM + PostgreSQL + Docker + Kubernetes + Helm  
**Última actualización:** 17 de febrero de 2026

Esta es la guía completamente actualizada con todos los archivos creados y comandos necesarios para el despliegue.

---

## 📋 Resumen Ejecutivo

✅ **Archivos creados:**
- Módulo completo de Usuarios (entity, dtos, controller, service, module)
- Configuración TypeORM para PostgreSQL
- Dockerfile multistage optimizado
- Chart Helm completo con 5 templates
- Variables de entorno configuradas

✅ **Lo que vas a desplegar:**
- Backend NestJS con 10 endpoints REST
- Base de datos PostgreSQL con persistencia
- Acceso externo por NodePort:30091

---

## 🚀 GUÍA RÁPIDA (3 Pasos)

### En tu PC (PowerShell):
```powershell
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir
npm install
docker build -t TU-USUARIO/nestasir:latest .
docker push TU-USUARIO/nestasir:latest
git add . && git commit -m "Deploy NestJS + PostgreSQL" && git push
```

### En tu VPS (SSH):
```bash
cd ~/devops/docker/caronte/proyectos/nestasir
git pull
helm upgrade --install nestasir ./deploy/kubernetes/nestasir -n nestasir-ns --create-namespace
kubectl get pods -n nestasir-ns
```

### Probar:
```bash
curl http://TU-IP:30091/usuario
```

---

## 📁 Estructura Completa del Proyecto

```
c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir/
│
├── src/                                    # Código Fuente
│   ├── app.module.ts                       ✅ TypeORM + PostgreSQL
│   ├── main.ts                             ✅ Puerto 3001 + validación
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── products/                           (módulo existente)
│   └── usuario/                            ✅ NUEVO
│       ├── entities/
│       │   └── usuario.entity.ts           (Entity TypeORM)
│       ├── dto/
│       │   ├── create-usuario.dto.ts       (Validaciones)
│       │   └── update-usuario.dto.ts
│       ├── usuario.controller.ts           (10 endpoints)
│       ├── usuario.service.ts              (Lógica)
│       └── usuario.module.ts
│
├── package.json                            ✅ Actualizado (pg, typeorm)
├── .env                                    ✅ Variables locales
├── Dockerfile                              ✅ Multistage build
├── .dockerignore                           ✅
│
└── deploy/
    ├── README.md                           ✅ Doc de despliegue
    └── kubernetes/
        └── nestasir/                       ✅ Helm Chart
            ├── Chart.yaml
            ├── values.yaml                 (Config centralizada)
            └── templates/
                ├── deployment.yaml         (NestJS)
                ├── service.yaml            (NodePort)
                ├── statefulset-postgres.yaml
                ├── service-postgres.yaml
                └── secret-postgres.yaml
```

---

## 🛠️ PASO A PASO COMPLETO

### PARTE 1: Configuración Local (Tu PC Windows)

#### 1.1 Instalar Dependencias

```powershell
# Navegar al proyecto
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir

# Instalar dependencias (incluye TypeORM, PostgreSQL pg, validadores)
npm install

# Verificar que TypeScript no tenga errores
npm run build
```

**Dependencias instaladas:**
- `@nestjs/typeorm@^11.0.0`
- `typeorm@^0.3.28`
- `pg@^8.13.1`
- `class-validator@^0.14.3`
- `class-transformer@^0.5.1`

#### 1.2 Editar values.yaml

**⚠️ CRÍTICO:** Abre `deploy/kubernetes/nestasir/values.yaml` y **cambia `tu-usuario`**:

```yaml
app:
  name: nestasir-backend
  image:
    repository: CAMBIAR-AQUI-TU-USUARIO-DOCKERHUB/nestasir  # ← AQUÍ
    tag: latest
```

#### 1.3 Construir Imagen Docker

```powershell
# Asegurarse de estar en la raíz del proyecto
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir

# Construir (reemplazar tu-usuario)
docker build -t tu-usuario/nestasir:latest .

# Login en Docker Hub
docker login
# Te pedirá: Username y Password

# Subir la imagen
docker push tu-usuario/nestasir:latest

# Verificar
docker images | findstr nestasir
```

**Ejemplo real:**
```powershell
docker build -t salyrdev/nestasir:latest .
docker push salyrdev/nestasir:latest
```

#### 1.4 Subir a Git

```powershell
# Desde la raíz de HLC
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC

# Ver cambios
git status

# Agregar archivos
git add devops/docker/caronte/proyectos/nestasir/

# Commit
git commit -m "feat: NestJS + PostgreSQL con Helm configurado"

# Push
git push origin main
```

---

### PARTE 2: Despliegue en VPS

#### 2.1 Conectar al VPS

```powershell
# Desde PowerShell
ssh usuario@161.97.152.19
# Ajustar IP y usuario
```

#### 2.2 Actualizar Repositorio

```bash
# Navegar al proyecto
cd ~/devops/docker/caronte/proyectos/nestasir

# Actualizar desde Git
git pull origin main

# Verificar archivos Helm
ls -la deploy/kubernetes/nestasir/templates/
```

#### 2.3 Desplegar con Helm

```bash
# Desde la raíz del proyecto en el VPS
cd ~/devops/docker/caronte/proyectos/nestasir

# Opcional: Si existe instalación previa, eliminarla
helm uninstall nestasir -n nestasir-ns

# Desplegar
helm upgrade --install nestasir ./deploy/kubernetes/nestasir \
  -n nestasir-ns \
  --create-namespace

# Ver progreso (Ctrl+C para salir del watch)
watch kubectl get pods -n nestasir-ns
```

**Salida esperada:**
```
NAME                                READY   STATUS    RESTARTS   AGE
nestasir-backend-xxxxxxxxx-xxxxx    1/1     Running   0          2m
nestasir-db-0                       1/1     Running   0          2m
```

#### 2.4 Verificar Despliegue

```bash
# Ver pods
kubectl get pods -n nestasir-ns

# Ver servicios
kubectl get svc -n nestasir-ns

# Ver persistent volumes
kubectl get pvc -n nestasir-ns

# Ver logs de la app
kubectl logs -f deployment/nestasir-backend -n nestasir-ns

# Ver logs de PostgreSQL
kubectl logs -f statefulset/nestasir-db -n nestasir-ns
```

---

### PARTE 3: Pruebas y Verificación

#### 3.1 Probar Endpoints desde el VPS

```bash
# IP del servidor (ajustar a tu IP real)
export API_URL="http://161.97.152.19:30091"

# 1. Endpoint raíz
curl $API_URL

# 2. Crear usuario
curl -X POST $API_URL/usuario \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "password": "mipassword123"
  }'

# 3. Listar usuarios
curl $API_URL/usuario

# 4. Obtener por ID
curl $API_URL/usuario/1

# 5. Buscar por email
curl $API_URL/usuario/email/juan@ejemplo.com

# 6. Actualizar
curl -X PATCH $API_URL/usuario/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan Actualizado"}'

# 7. Desactivar
curl -X PUT $API_URL/usuario/1/deactivate

# 8.Activar
curl -X PUT $API_URL/usuario/1/activate

# 9. Eliminar
curl -X DELETE $API_URL/usuario/1
```

#### 3.2 Acceder a PostgreSQL Directamente

```bash
# Entrar al pod de PostgreSQL
kubectl exec -it nestasir-db-0 -n nestasir-ns -- psql -U admin -d nestasir_db

# Dentro de psql:
\dt                           # Ver tablas
SELECT * FROM usuario;        # Ver usuarios
\d usuario                    # Ver estructura de tabla
\q                            # Salir
```

---

## 📚 Explicación Técnica

### Cómo funciona la conexión NestJS ↔ PostgreSQL

#### 1. app.module.ts lee variables de entorno:
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,        // → 'nestasir-db'
  port: parseInt(process.env.DB_PORT),  // → 5432
  username: process.env.DB_USER,    // → 'admin'
  password: process.env.DB_PASSWORD,// → (desde secret)
  database: process.env.DB_NAME,    // → 'nestasir_db'
})
```

#### 2. deployment.yaml pasa las variables:
```yaml
env:
  - name: DB_HOST
    value: nestasir-db          # ← Nombre del Service de PostgreSQL
  - name: DB_PORT
    value: "5432"
  - name: DB_USER
    value: admin
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: nestasir-backend-postgres-secret
        key: POSTGRES_PASSWORD
  - name: DB_NAME
    value: nestasir_db
```

#### 3. statefulset-postgres.yaml crea la BD:
```yaml
env:
  - name: POSTGRES_DB         # ← PostgreSQL crea esta BD al iniciar
    value: nestasir_db
  - name: POSTGRES_USER
    value: admin
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef: ...
```

#### 4. TypeORM crea las tablas automáticamente
Por el `synchronize: true` en app.module.ts, TypeORM detecta las entities y crea las tablas.

---

## 🔧 Configuración de values.yaml

```yaml
# --- Configuración de la Aplicación ---
app:
  name: nestasir-backend
  image:
    repository: tu-usuario/nestasir   # ← CAMBIAR
    tag: latest
    pullPolicy: Always
  container:
    name: nestasir-backend
    port: 3001
    replicas: 1
  service:
    type: NodePort
    port: 3001
    nodePort: 30091                   # ← Puerto externo

# --- Configuración de PostgreSQL ---
postgres:
  name: nestasir-db
  image:
    repository: postgres
    tag: "15-alpine"
    pullPolicy: IfNotPresent
  service:
    port: 5432
  auth:
    username: admin
    password: password_segura_123      # ← Cambiar en producción
    database: nestasir_db
  persistence:
    size: 2Gi
    storageClassName: "microk8s-hostpath"  # ← Ajustar según cluster
```

---

## 🐛 Troubleshooting

### Problema: Pod en CrashLoopBackOff

```bash
# Ver logs
kubectl logs nestasir-backend-xxxxx-yyyy -n nestasir-ns

# Ver eventos
kubectl get events -n nestasir-ns --sort-by='.lastTimestamp'

# Reiniciar
kubectl rollout restart deployment/nestasir-backend -n nestasir-ns
```

### Problema: No puedo acceder a la API

```bash
# Verificar servicio
kubectl get svc -n nestasir-ns

# Debe mostrar:
# nestasir-backend   NodePort   10.x.x.x   <none>   3001:30091/TCP

# Verificar firewall
sudo ufw allow 30091/tcp
```

### Problema: Error de conexión a PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
kubectl get pods -n nestasir-ns | grep nestasir-db

# Ver logs de PostgreSQL
kubectl logs nestasir-db-0 -n nestasir-ns

# Verificar variables en la app
kubectl exec -it <pod-nestasir> -n nestasir-ns -- env | grep DB_
```

### Problema: Imagen no se actualiza

```bash
# Forzar nuevo pull
kubectl delete pod -l app=nestasir-backend -n nestasir-ns

# O reiniciar deployment
kubectl rollout restart deployment/nestasir-backend -n nestasir-ns
```

---

## 🔄 Actualizar la Aplicación

### Cuando cambies código:

**En tu PC:**
```powershell
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir
docker build -t tu-usuario/nestasir:latest .
docker push tu-usuario/nestasir:latest
git add . && git commit -m "Cambios" && git push
```

**En VPS:**
```bash
cd ~/devops/docker/caronte/proyectos/nestasir
git pull
kubectl rollout restart deployment/nestasir-backend -n nestasir-ns
kubectl rollout status deployment/nestasir-backend -n nestasir-ns
```

---

## 🗑️ Desinstalar

```bash
# Desinstalar release
helm uninstall nestasir -n nestasir-ns

# Eliminar namespace (borra todo)
kubectl delete namespace nestasir-ns

# Verificar
kubectl get all -n nestasir-ns
```

---

## ✅ Checklist Final

### En Local (PC):
- [ ] `npm install` ejecutado
- [ ] `values.yaml` editado con tu usuario
- [ ] Imagen construida: `docker build`
- [ ] Imagen subida: `docker push`
- [ ] Cambios en git: `git push`

### En VPS:
- [ ] Repo actualizado: `git pull`
- [ ] Helm desplegado: `helm upgrade --install`
- [ ] Pods corriendo: `kubectl get pods`
- [ ] API funcionando: `curl http://IP:30091/usuario`

---

## 📝 Comandos Útiles

```bash
# Helm
helm list -n nestasir-ns
helm get values nestasir -n nestasir-ns
helm history nestasir -n nestasir-ns

# Kubernetes
kubectl get all -n nestasir-ns
kubectl describe pod <pod-name> -n nestasir-ns
kubectl top pods -n nestasir-ns
kubectl scale deployment nestasir-backend --replicas=2 -n nestasir-ns

# Logs
kubectl logs -f deployment/nestasir-backend -n nestasir-ns
kubectl logs -f statefulset/nestasir-db -n nestasir-ns

# Port-forward (para debug local desde VPS)  
kubectl port-forward svc/nestasir-backend 3001:3001 -n nestasir-ns
```

---

## 🎯 Archivos Clave y su Función

| Archivo | Función | Ubicación |
|---------|---------|-----------|
| `package.json` | Dependencias Node.js | Local |
| `src/app.module.ts` | Config TypeORM | Local |
| `src/usuario/*` | Módulo CRUD | Local |
| `Dockerfile` | Build imagen | Local |
| `.env` | Variables dev local | Local |
| `values.yaml` | Config Helm | Local + VPS |
| `templates/deployment.yaml` | Pod NestJS | VPS |
| `templates/statefulset-postgres.yaml` | Pod PostgreSQL | VPS |
| `templates/service.yaml` | Exposición externa | VPS |
| `templates/service-postgres.yaml` | Red interna BD | VPS |
| `templates/secret-postgres.yaml` | Contraseña | VPS |

---

## ✨ Características Implementadas

### Módulo Usuario (CRUD completo):
- ✅ Entity con TypeORM decorators
- ✅ DTOs con validaciones (class-validator)
- ✅ Service con Repository pattern
- ✅ Controller con 10 endpoints REST
- ✅ Timestamps automáticos (creación/actualización)
- ✅ Campo activo/inactivo
- ✅ Email único

### Infraestructura:
- ✅ PostgreSQL 15 con persistencia (PVC)
- ✅ Secrets para contraseñas
- ✅ Health checks (liveness/readiness probes)
- ✅ Resource limits configurados
- ✅ NodePort para acceso externo
- ✅ ClusterIP para comunicación interna
- ✅ Dockerfile multistage optimizado

---

## 📖 Referencias

- [NestJS Docs](https://docs.nestjs.com/)
- [TypeORM Docs](https://typeorm.io/)
- [Helm Docs](https://helm.sh/docs/)
- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)

---

**¡Despliegue completado!** 🎉

Para soporte, revisa los logs de los pods o la sección de Troubleshooting.
