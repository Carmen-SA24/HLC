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

## 🎯 Despliegue en 4 Pasos

### 1️⃣ En tu PC (PowerShell) - Preparar y Subir

```powershell
# Ir al proyecto
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir

# Instalar dependencias
npm install

# Construir imagen Docker
docker build -t carmen24/nestasir:latest .

# Login Docker Hub (te pedirá usuario y contraseña)
docker login

# Subir imagen a Docker Hub
docker push carmen24/nestasir:latest
```

### 2️⃣ Subir Cambios a Git (PowerShell)

```powershell
# Ir a la raíz del proyecto HLC
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC

# Ver archivos modificados
git status

# Agregar todos los cambios del proyecto nestasir
git add devops/docker/caronte/proyectos/nestasir/

# Hacer commit
git commit -m "feat: Despliegue NestJS + PostgreSQL con Helm"

# Subir al repositorio remoto
git push origin main
```

**✅ Verificar que se subió:**
```powershell
# Ver último commit
git log --oneline -1
```

### 3️⃣ En el VPS - Desplegar con Helm

```bash
# Conectar al servidor VPS
ssh usuario@161.97.152.19

# Navegar al proyecto (ajustar la ruta según tu VPS)
cd ~/HLC/devops/docker/caronte/proyectos/nestasir
# O si tu ruta es diferente:
# cd ~/devops/docker/caronte/proyectos/nestasir

# Actualizar código desde Git
git pull origin main

# Ver que los archivos llegaron
ls -la deploy/kubernetes/nestasir/

# Desplegar con Helm
helm upgrade --install nestasir ./deploy/kubernetes/nestasir \
  -n nestasir-ns \
  --create-namespace

# Verificar despliegue
kubectl get pods -n nestasir-ns

# Esperar hasta que ambos pods estén Running (puede tardar 1-2 minutos)
# Resultado esperado:
# nestasir-backend-xxxxx-xxxx    1/1     Running   0          2m
# nestasir-db-0                  1/1     Running   0          2m
```

> **📍 Nota:** Ajusta la ruta `cd ~/HLC/devops/...` según donde tengas clonado tu repositorio en el VPS.

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

### 4️⃣ Probar API

**Desde el VPS:**
```bash
# Crear un usuario
curl -X POST http://localhost:30091/usuario \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan Pérez","email":"juan@test.com","password":"123456"}'

# Listar todos los usuarios
curl http://localhost:30091/usuario

# Obtener usuario por ID
curl http://localhost:30091/usuario/1

# Buscar por email
curl http://localhost:30091/usuario/email/juan@test.com
```

**Desde tu PC (PowerShell):**
```powershell
# Crear usuario
$body = @{
    nombre = "Juan Pérez"
    email = "juan@test.com"
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

## 📊 Comandos Útiles de Monitoreo

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

## ✅ Checklist de Despliegue

### Paso 1 - En tu PC (Local):
```powershell
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir
```
- [ ] `npm install` ejecutado
- [ ] `docker build -t carmen24/nestasir:latest .` exitoso
- [ ] `docker login` completado
- [ ] `docker push carmen24/nestasir:latest` exitoso

### Paso 2 - Git (Local):
```powershell
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC
```
- [ ] `git add devops/docker/caronte/proyectos/nestasir/`
- [ ] `git commit -m "feat: Deploy NestJS + PostgreSQL"`
- [ ] `git push origin main` exitoso

### Paso 3 - VPS (SSH):
```bash
ssh usuario@161.97.152.19
cd ~/HLC/devops/docker/caronte/proyectos/nestasir
```
- [ ] `git pull origin main` exitoso
- [ ] `helm upgrade --install nestasir ./deploy/kubernetes/nestasir -n nestasir-ns --create-namespace` ejecutado
- [ ] `kubectl get pods -n nestasir-ns` → ambos pods en estado **Running**
- [ ] `kubectl logs -f deployment/nestasir-backend -n nestasir-ns` → sin errores

### Paso 4 - Verificación:
- [ ] `curl http://localhost:30091/usuario` → responde `[]` o lista de usuarios
- [ ] Crear usuario → responde con el usuario creado
- [ ] La aplicación es accesible desde `http://161.97.152.19:30091`

---

## 🚀 Resumen Ejecutivo (Copiar y Pegar)

### En Local (PowerShell):
```powershell
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir
npm install
docker build -t carmen24/nestasir:latest .
docker login
docker push carmen24/nestasir:latest
cd ..\..\..\..\..\..
git add devops/docker/caronte/proyectos/nestasir/
git commit -m "feat: Deploy NestJS + PostgreSQL"
git push origin main
```

### En VPS (SSH):
```bash
ssh usuario@161.97.152.19
cd ~/HLC/devops/docker/caronte/proyectos/nestasir
git pull origin main
helm upgrade --install nestasir ./deploy/kubernetes/nestasir -n nestasir-ns --create-namespace
kubectl get pods -n nestasir-ns
kubectl logs -f deployment/nestasir-backend -n nestasir-ns
curl http://localhost:30091/usuario
```

---

**¡Listo!** 🎉 Tu API NestJS con PostgreSQL está desplegada.
