# 🚀 Despliegue NestJS + PostgreSQL (nestasir)

Guía rápida y directa para desplegar el proyecto con Helm.

---

## 📦 Archivos del Proyecto

### Código NestJS (ya creados):
```
src/
├── app.module.ts              ✅ TypeORM + PostgreSQL configurado
├── main.ts                    ✅ Puerto 3001
├── usuario/                   ✅ Módulo CRUD completo
│   ├── entities/usuario.entity.ts
│   ├── dto/create-usuario.dto.ts
│   ├── dto/update-usuario.dto.ts
│   ├── usuario.controller.ts
│   ├── usuario.service.ts
│   └── usuario.module.ts
├── package.json               ✅ Con pg, typeorm, validadores
├── .env                       ✅ Variables PostgreSQL
├── Dockerfile                 ✅ Multistage build
└── .dockerignore              ✅
```

### Helm Chart (ya creados):
```
deploy/kubernetes/nestasir/
├── Chart.yaml
├── values.yaml                ✅ Usuario: carmen24
└── templates/
    ├── deployment.yaml        # App NestJS
    ├── service.yaml           # NodePort 30091
    ├── statefulset-postgres.yaml  # PostgreSQL + PVC
    ├── service-postgres.yaml  # Red interna BD
    └── secret-postgres.yaml   # Contraseña
```

---

## 🎯 Comandos Ejecutados en el Despliegue Exitoso

### ✅ 1️⃣ Local (PowerShell) - Solo Git 

```powershell
# Navegar al proyecto
cd C:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir

# Subir cambios a Git
git add .
git commit -m "Add NestJS PostgreSQL deployment with Helm"
git push origin main
```

### ✅ 2️⃣ VPS (SSH) - Git, Docker y Helm

```bash
# Conectar al servidor VPS
ssh rosa@161.97.152.19

# Navegar al proyecto
cd ~/devops/docker/caronte/proyectos/nestasir

# Actualizar código desde Git
git pull origin main

# Construir imagen Docker (tardó ~14 minutos)
docker build -t carmen24/nestasir:latest .

# Login Docker Hub (ya estaba autenticado)
docker login

# Subir imagen a Docker Hub
docker push carmen24/nestasir:latest

# Desplegar con Helm
helm upgrade --install nestasir ./deploy/kubernetes/nestasir -n nestasir-ns --create-namespace

# Verificar despliegue
kubectl get pods -n nestasir-ns
kubectl get svc -n nestasir-ns
```

**Resultado esperado:**
```
NAME                               READY   STATUS    RESTARTS   AGE
nestasir-backend-95f8f9f68-jtdlr   1/1     Running   0          2m
nestasir-db-0                      1/1     Running   0          2m

NAME               TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
nestasir-backend   NodePort    10.152.183.99    <none>        3001:30091/TCP   2m
nestasir-db        ClusterIP   10.152.183.173   <none>        5432/TCP         2m
```

### ✅ 3️⃣ Verificación del Despliegue

```bash
# Una vez que ambos pods estén Running, probar la API
curl http://localhost:30091/usuario

# Debe devolver: []

# Crear un usuario de prueba
curl -X POST http://localhost:30091/usuario \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test Usuario","email":"test@test.com","password":"123456"}'

# Verificar que se creó
curl http://localhost:30091/usuario

# Ver logs de la aplicación si hay problemas
kubectl logs -f deployment/nestasir-backend -n nestasir-ns
```

---

## 🎯 Resumen de Archivos Importantes

### Rutas de directorios:
- **Local**: `C:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir`
- **VPS**: `~/devops/docker/caronte/proyectos/nestasir`

### 4️⃣ En el VPS - Verificar que Funciona

```bash
# Ver logs de la aplicación
kubectl logs -f deployment/nestasir-backend -n nestasir-ns
# Ctrl+C para salir

# Ver logs de PostgreSQL
kubectl logs -f statefulset/nestasir-db -n nestasir-ns
# Ctrl+C para salir

# Ver todos los recursos
kubectl get all -n nestasir-ns

# Probar la API
curl http://localhost:30091/usuario
# O desde tu PC:
curl http://161.97.152.19:30091/usuario
```

### 4️⃣ Probar API - Comandos Ejecutados Exitosamente en VPS

```bash
# ✅ EJECUTADO: Crear usuario Carmen Test
curl -X POST http://localhost:30091/usuario \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Carmen Test","email":"carmen@test.com","password":"123456"}'

# ✅ RESPUESTA OBTENIDA:
# {"id":1,"nombre":"Carmen Test","email":"carmen@test.com","password":"123456","activo":true,"fechaCreacion":"2026-02-17T11:10:59.859Z","fechaActualizacion":"2026-02-17T11:10:59.859Z"}

# ✅ EJECUTADO: Listar usuarios
curl http://localhost:30091/usuario
# RESPUESTA: [{"id":1,"nombre":"Carmen Test","email":"carmen@test.com","password":"123456","activo":true,"fechaCreacion":"2026-02-17T11:10:59.859Z","fechaActualizacion":"2026-02-17T11:10:59.859Z"}]

# ✅ EJECUTADO: Obtener por ID 
curl http://localhost:30091/usuario/1
# RESPUESTA: {"id":1,"nombre":"Carmen Test","email":"carmen@test.com","password":"123456","activo":true,"fechaCreacion":"2026-02-17T11:10:59.859Z","fechaActualizacion":"2026-02-17T11:10:59.859Z"}

# ✅ EJECUTADO: Buscar por email
curl http://localhost:30091/usuario/email/carmen@test.com
# RESPUESTA: {"id":1,"nombre":"Carmen Test","email":"carmen@test.com","password":"123456","activo":true,"fechaCreacion":"2026-02-17T11:10:59.859Z","fechaActualizacion":"2026-02-17T11:10:59.859Z"}
```

**Desde tu PC (PowerShell) - OPCIONAL:**
```powershell
# Crear usuario (alternativa desde PC)
$body = @{
    nombre = "Usuario desde PC"
    email = "pc@test.com"
    password = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://161.97.152.19:30091/usuario" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Listar usuarios
Invoke-RestMethod -Uri "http://161.97.152.19:30091/usuario"
```

---

## �️ Gestión de Base de Datos vía Web (pgAdmin)

Para gestionar la BD vía web, te agrego **pgAdmin** (interfaz web de PostgreSQL). Ejecuta estos comandos en la VPS:

```bash
# 1. Crear pgAdmin
kubectl create deployment pgadmin --image=dpage/pgadmin4:latest -n nestasir-ns

# 2. Configurar credenciales (email: admin@admin.com, password: admin123)
kubectl set env deployment/pgadmin PGADMIN_DEFAULT_EMAIL=admin@admin.com PGADMIN_DEFAULT_PASSWORD=admin123 -n nestasir-ns

# 3. Exponer pgAdmin en puerto 30092
kubectl expose deployment pgadmin --port=80 --target-port=80 --type=NodePort -n nestasir-ns

# 4. Editar el servicio para asignar puerto específico
kubectl patch svc pgadmin -n nestasir-ns -p '{"spec":{"ports":[{"port":80,"targetPort":80,"nodePort":30092}]}}'

# 5. Verificar que todo esté corriendo
kubectl get pods -n nestasir-ns
kubectl get svc -n nestasir-ns
```

### 🌐 Acceder a pgAdmin:

**URL**: `http://161.97.152.19:30092`

**Credenciales**:
- Email: `admin@admin.com`
- Password: `admin123`

### 🔌 Conectar a tu BD:

Una vez dentro de pgAdmin:
1. Clic derecho en "Servers" → "Create" → "Server"
2. **General Tab**: Name = `NestAsir DB`
3. **Connection Tab**:
   - Host: `nestasir-db.nestasir-ns.svc.cluster.local`
   - Port: `5432`
   - Database: `nestasir_db`
   - Username: `admin`
   - Password: `password_segura_123`
4. Clic "Save"

---

## 🔄 Escalado y Réplicas

### Escalado Horizontal en la Misma VPS:

```bash
# Ver el deployment actual
kubectl get deployment -n nestasir-ns

# Escalar a 3 réplicas del backend
kubectl scale deployment nestasir-backend --replicas=3 -n nestasir-ns

# Ver las réplicas corriendo
kubectl get pods -n nestasir-ns

# Resultado: tendrás 3 pods del backend + 1 PostgreSQL
# nestasir-backend-xxxxx-xxx1   1/1   Running
# nestasir-backend-xxxxx-xxx2   1/1   Running  
# nestasir-backend-xxxxx-xxx3   1/1   Running
# nestasir-db-0                 1/1   Running
```

### Réplicas desde Otra Máquina:

Si tienes otra máquina con acceso al mismo cluster Kubernetes:

```bash
# 1. Clonar el repositorio en la otra máquina
git clone tu-repositorio-github
cd ruta/al/proyecto/nestasir

# 2. Desplegar otra instancia con Helm
helm upgrade --install nestasir-replica ./deploy/kubernetes/nestasir -n nestasir-replica --create-namespace

# 3. O gestionar las réplicas existentes remotamente
kubectl scale deployment nestasir-backend --replicas=5 -n nestasir-ns
```

### Ventajas del Despliegue Kubernetes + Helm:

✅ **Alta disponibilidad** - Si un pod falla, otros continúan  
✅ **Escalado horizontal** - Agregar/quitar réplicas al instante  
✅ **Load balancing** - Tráfico distribuido automáticamente entre réplicas  
✅ **Persistencia** - PostgreSQL con almacenamiento persistente  
✅ **Gestión declarativa** - Helm mantiene el estado deseado

---

## �📊 Comandos Útiles de Monitoreo

### Ver Estado del Despliegue
```bash
# Ver todos los recursos
kubectl get all -n nestasir-ns

# Ver pods con detalles
kubectl get pods -n nestasir-ns -o wide

# Describir un pod (para debug)
kubectl describe pod <nombre-pod> -n nestasir-ns

# Ver eventos recientes
kubectl get events -n nestasir-ns --sort-by='.lastTimestamp' | tail -20
```

### Ver Logs en Tiempo Real
```bash
# Logs de la aplicación
kubectl logs -f deployment/nestasir-backend -n nestasir-ns

# Logs de PostgreSQL
kubectl logs -f statefulset/nestasir-db -n nestasir-ns

# Logs de un pod específico
kubectl logs <nombre-pod> -n nestasir-ns
```

### Acceder a PostgreSQL
```bash
# Conectar a la base de datos
kubectl exec -it nestasir-db-0 -n nestasir-ns -- psql -U admin -d nestasir_db

# Comandos útiles dentro de psql:
\dt                    # Ver tablas
SELECT * FROM usuario; # Ver usuarios
\d usuario            # Ver estructura de tabla usuario
\q                    # Salir
```

---

## 🔧 Configuración Importante

### values.yaml (ya configurado):
```yaml
app:
  image:
    repository: carmen24/nestasir  # ✅ Usuario configurado
    tag: latest

postgres:
  auth:
    password: password_segura_123      # ⚠️ Cambiar en producción
```

### Variables de Conexión:
El `app.module.ts` lee estas variables que Kubernetes pasa automáticamente:
- `DB_HOST` = `nestasir-db` (service de PostgreSQL)
- `DB_PORT` = `5432`
- `DB_USER` = `admin`
- `DB_PASSWORD` = (desde secret)
- `DB_NAME` = `nestasir_db`

---

## 🐛 Solución Rápida de Problemas

### Pod en CrashLoopBackOff:
```bash
kubectl logs <pod-name> -n nestasir-ns
kubectl rollout restart deployment/nestasir-backend -n nestasir-ns
```

### No puedo acceder al puerto 30091:
```bash
kubectl get svc -n nestasir-ns  # Debe mostrar NodePort 30091
sudo ufw allow 30091/tcp        # Abrir firewall
```

### Imagen no se actualiza:
```bash
kubectl delete pod -l app=nestasir-backend -n nestasir-ns
```

---

## 🔄 Actualizar Código

**En PC:**
```powershell
docker build -t carmen24/nestasir:latest .
docker push carmen24/nestasir:latest
git push
```

**En VPS:**
```bash
git pull
kubectl rollout restart deployment/nestasir-backend -n nestasir-ns
```

---

## 🗑️ Desinstalar

```bash
helm uninstall nestasir -n nestasir-ns
kubectl delete namespace nestasir-ns
```

---

## 📡 Endpoints Disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/usuario` | Listar todos |
| GET | `/usuario/:id` | Obtener por ID |
| GET | `/usuario/email/:email` | Buscar por email |
| POST | `/usuario` | Crear nuevo |
| PATCH | `/usuario/:id` | Actualizar parcial |
| PUT | `/usuario/:id` | Actualizar completo |
| PUT | `/usuario/:id/activate` | Activar |
| PUT | `/usuario/:id/deactivate` | Desactivar |
| DELETE | `/usuario/:id` | Eliminar |

**URL Base:** `http://161.97.152.19:30091` (cambiar IP por la tuya)

---

## ✅ Checklist del Despliegue Exitoso

### Paso 1 - Local (PowerShell) - Solo Git:
```powershell
cd C:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir
```
- [✓] `git add .` ejecutado
- [✓] `git commit -m "Add NestJS PostgreSQL deployment with Helm"` exitoso
- [✓] `git push origin main` exitoso

### Paso 2 - VPS (SSH) - Git, Docker y Helm:
```bash
ssh rosa@161.97.152.19
cd ~/devops/docker/caronte/proyectos/nestasir
```
- [✓] `git pull origin main` exitoso
- [✓] `docker build -t carmen24/nestasir:latest .` exitoso (~14 minutos)
- [✓] `docker login` completado (ya autenticado)
- [✓] `docker push carmen24/nestasir:latest` exitoso
- [✓] `helm upgrade --install nestasir ./deploy/kubernetes/nestasir -n nestasir-ns --create-namespace` ejecutado
- [✓] `kubectl get pods -n nestasir-ns` → ambos pods **Running**
- [✓] `kubectl get svc -n nestasir-ns` → NodePort 30091 activo

### Paso 3 - Verificación:
- [✓] `curl http://localhost:30091/usuario` → responde `[]`
- [✓] Crear usuario con curl → respuesta exitosa
- [✓] Aplicación accesible desde `http://161.97.152.19:30091`

---

## 🚀 Comandos Ejecutados con Éxito (Copiar y Pegar)

### En Local (PowerShell) - Solo Git:
```powershell
cd C:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir
git add .
git commit -m "Add NestJS PostgreSQL deployment with Helm"
git push origin main
```

### En VPS (SSH) - Git, Docker y Helm:
```bash
ssh rosa@161.97.152.19
cd ~/devops/docker/caronte/proyectos/nestasir
git pull origin main
docker build -t carmen24/nestasir:latest .
docker login
docker push carmen24/nestasir:latest
helm upgrade --install nestasir ./deploy/kubernetes/nestasir -n nestasir-ns --create-namespace
kubectl get pods -n nestasir-ns
kubectl get svc -n nestasir-ns
curl http://localhost:30091/usuario
```

> 🎉 **¡DESPLIEGUE EXITOSO!** Tu API NestJS con PostgreSQL está funcionando en http://161.97.152.19:30091

---

**¡Listo!** 🎉 Tu API NestJS con PostgreSQL está desplegada.
