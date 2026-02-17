# Despliegue NestJS + PostgreSQL con Helm

## 📋 Estructura del Proyecto

```
nestasir/
├── src/                          # Código fuente NestJS
│   ├── usuario/                  # Módulo de usuarios
│   │   ├── entities/
│   │   │   └── usuario.entity.ts
│   │   ├── dto/
│   │   │   ├── create-usuario.dto.ts
│   │   │   └── update-usuario.dto.ts
│   │   ├── usuario.controller.ts
│   │   ├── usuario.service.ts
│   │   └── usuario.module.ts
│   ├── app.module.ts
│   └── main.ts
├── deploy/kubernetes/nestasir/   # Configuración Helm
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── statefulset-postgres.yaml
│       ├── service-postgres.yaml
│       └── secret-postgres.yaml
├── Dockerfile
├── .dockerignore
├── .env
└── package.json
```

## 🚀 Pasos de Despliegue

### 1. Instalar Dependencias Localmente

```powershell
cd c:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC\devops\docker\caronte\proyectos\nestasir
npm install
```

### 2. Probar Localmente (Opcional)

Necesitas PostgreSQL corriendo localmente o actualizar el `.env`:

```powershell
npm run start:dev
```

La aplicación estará en `http://localhost:3001`

### 3. Construir y Subir la Imagen Docker

**IMPORTANTE**: Cambia `tu-usuario` por tu usuario de Docker Hub en `values.yaml` antes de construir.

```powershell
# Construir la imagen
docker build -t tu-usuario/nestasir:latest .

# Login en Docker Hub
docker login

# Subir la imagen
docker push tu-usuario/nestasir:latest
```

### 4. Desplegar con Helm en Kubernetes

Desde tu VPS o donde tengas Kubernetes configurado:

```bash
# Ubicarte en la carpeta del proyecto
cd ~/devops/docker/caronte/proyectos/nestasir

# Opcional: Limpiar instalación anterior
helm uninstall nestasir -n nestasir-ns

# Instalar o actualizar con Helm
helm upgrade --install nestasir ./deploy/kubernetes/nestasir \
  -n nestasir-ns \
  --create-namespace

# Verificar el despliegue
kubectl get pods -n nestasir-ns
kubectl get svc -n nestasir-ns
```

### 5. Verificar el Despliegue

```bash
# Ver logs de la aplicación
kubectl logs -f deployment/nestasir-backend -n nestasir-ns

# Ver logs de PostgreSQL
kubectl logs -f statefulset/nestasir-db -n nestasir-ns

# Ver todos los recursos
kubectl get all -n nestasir-ns
```

### 6. Acceder a la Aplicación

La aplicación estará disponible en:
- **NodePort**: `http://<IP-DEL-CLUSTER>:30091`
- Ejemplo: `http://161.97.152.19:30091`

## 📡 Endpoints de la API

### Usuario Endpoints

- `GET /usuario` - Obtener todos los usuarios
- `GET /usuario/:id` - Obtener un usuario por ID
- `GET /usuario/email/:email` - Obtener un usuario por email
- `POST /usuario` - Crear un nuevo usuario
- `PATCH /usuario/:id` - Actualizar un usuario parcialmente
- `PUT /usuario/:id` - Actualizar un usuario completamente
- `PUT /usuario/:id/activate` - Activar un usuario
- `PUT /usuario/:id/deactivate` - Desactivar un usuario
- `DELETE /usuario/:id` - Eliminar un usuario

### Ejemplo de Creación de Usuario

```json
POST http://161.97.152.19:30091/usuario
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "mipassword123"
}
```

## ⚙️ Configuración Importante

### Archivo `values.yaml`

Personaliza estos valores antes de desplegar:

```yaml
app:
  image:
    repository: tu-usuario/nestasir  # ⚠️ CAMBIAR POR TU USUARIO DE DOCKER HUB
    tag: latest
  service:
    nodePort: 30091  # Puerto de acceso externo

postgres:
  auth:
    username: admin
    password: password_segura_123  # ⚠️ CAMBIAR POR UNA CONTRASEÑA SEGURA
    database: nestasir_db
  persistence:
    size: 2Gi
    storageClassName: "microk8s-hostpath"  # Ajustar según tu cluster
```

## 🔧 Comandos Útiles

### Helm

```bash
# Ver releases instalados
helm list -n nestasir-ns

# Actualizar configuración sin reinstalar
helm upgrade nestasir ./deploy/kubernetes/nestasir -n nestasir-ns

# Desinstalar completamente
helm uninstall nestasir -n nestasir-ns
kubectl delete namespace nestasir-ns
```

### Kubernetes

```bash
# Ejecutar comandos dentro del pod de PostgreSQL
kubectl exec -it nestasir-db-0 -n nestasir-ns -- psql -U admin -d nestasir_db

# Port-forward para acceso local
kubectl port-forward svc/nestasir-backend 3001:3001 -n nestasir-ns

# Ver eventos del namespace
kubectl get events -n nestasir-ns --sort-by='.lastTimestamp'

# Reiniciar deployment
kubectl rollout restart deployment/nestasir-backend -n nestasir-ns
```

## 🐛 Troubleshooting

### Los pods no inician

```bash
# Ver detalles del pod
kubectl describe pod <nombre-pod> -n nestasir-ns

# Ver logs
kubectl logs <nombre-pod> -n nestasir-ns
```

### Error de conexión a la BD

1. Verificar que el pod de PostgreSQL esté corriendo
2. Verificar las variables de entorno en el deployment
3. Verificar que el Service de PostgreSQL existe

```bash
kubectl get svc -n nestasir-ns
kubectl get pods -n nestasir-ns
```

### Imagen no se descarga

1. Verificar que la imagen existe en Docker Hub
2. Verificar el nombre de la imagen en `values.yaml`
3. Si es privada, agregar imagePullSecrets

## 📚 Recursos Adicionales

- [Documentación de NestJS](https://docs.nestjs.com/)
- [Documentación de TypeORM](https://typeorm.io/)
- [Documentación de Helm](https://helm.sh/docs/)
- [PostgreSQL en Kubernetes](https://kubernetes.io/docs/tasks/run-application/run-replicated-stateful-application/)
