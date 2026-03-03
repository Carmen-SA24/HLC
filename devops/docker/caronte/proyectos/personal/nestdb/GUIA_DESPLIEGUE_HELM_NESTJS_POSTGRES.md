# Despliegue de NestAPI con Helm - NestJS + PostgreSQL con Ciberseguridad

Proyecto NestJS desplegado en Kubernetes usando Helm, con PostgreSQL y herencia de capas de seguridad desde ubsecurity.

---

## 1. Estructura de Archivos

```
nestapi/                              # Código fuente NestJS
├── src/                              # Código de la aplicación
│   ├── app.module.ts                 # TypeORM configurado
│   ├── main.ts                       # Puerto 3001
│   ├── pelicula/                     # Módulo CRUD películas
│   └── pokemon/                      # Módulo CRUD pokemon
│
nestdb/                               # Configuración de despliegue
├── deploy/
│   ├── docker-compose.yml            # Orquestación local
│   └── helm/                         # Helm chart
│       ├── Chart.yaml                # Metadatos del chart
│       ├── values.yaml               # Configuración parametrizable
│       └── templates/                # Plantillas Kubernetes
│           ├── deploy-nestapi.yaml   # Deployment NestJS
│           ├── service-nestapi.yaml  # Service NodePort
│           ├── ingress-nestapi.yaml  # Ingress
│           ├── configmap.yaml        # Variables de entorno
│           ├── statefulset-postgres.yaml  # PostgreSQL
│           └── service-postgres.yaml      # Service PostgreSQL
│
dockerfiles/js/nest/
├── Dockerfile                        # Construcción de imagen
└── start.sh                          # Script de arranque
```

---

## 2. Dockerfile - Herencia de Capas

**Ubicación:** `dockerfiles/js/nest/Dockerfile`

```dockerfile
ARG INICIALES=crsa
FROM ${INICIALES}ubsecurity:latest   # ← HERENCIA DE CIBERSEGURIDAD

ENV DEBIAN_FRONTEND=noninteractive

# Instalar Node.js LTS
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

# Copiar y compilar NestJS
WORKDIR /app
ARG PROYECTO=nestapi
COPY ./proyectos/${PROYECTO}/package*.json /app/
RUN npm install
COPY ./proyectos/${PROYECTO}/src /app/src
COPY ./proyectos/${PROYECTO}/tsconfig*.json /app/
COPY ./proyectos/${PROYECTO}/nest-cli.json /app/
RUN npm run build

# Script de inicio
COPY ./dockerfiles/js/nest/start.sh /root/admin/JS/nest/start.sh
RUN chmod +x /root/admin/JS/nest/start.sh

EXPOSE 3001 22
ENTRYPOINT ["/root/admin/JS/nest/start.sh"]
```

**Herencia completa:**
```
ubbase (Ubuntu base) 
  └─> ubsecurity (fail2ban, nmap, SSH, usuarios)
       └─> nestapi (NestJS + Node.js + PostgreSQL)
```

---

## 3. Script de Arranque

**Ubicación:** `dockerfiles/js/nest/start.sh`

```bash
#!/bin/bash
# Cargar scripts de seguridad heredados
source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh
source /root/admin/base/ciber/mainCiber.sh

# Crear usuario
useradd -m -s /bin/bash ${USUARIO:-admin-pod}
echo "${USUARIO:-admin-pod}:1234" | chpasswd

# Configurar SSH y seguridad
configurar_ssh
configurar_sudo

# Iniciar NestJS en background
cd /app
node dist/main &

# Iniciar SSH (mantiene el contenedor vivo)
exec /usr/sbin/sshd -D
```

**Funciones:**
- Crea usuario admin-pod
- Configura SSH y herramientas de seguridad
- Arranca NestJS en puerto 3001
- Conecta con PostgreSQL

---

## 4. PostgreSQL - StatefulSet

PostgreSQL se despliega como **StatefulSet** con persistencia garantizada:

```yaml
# statefulset-postgres.yaml
spec:
  replicas: 1
  serviceName: nestapi-postgres
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: "microk8s-hostpath"
        resources:
          requests:
            storage: 2Gi
```

**Características:**
- Persistencia de datos con PVC (2Gi)
- Imagen: postgres:15-alpine
- Service interno (ClusterIP) en puerto 5432
- Variables: DB_NAME, DB_USERNAME, DB_PASSWORD

---

## 5. Helm Chart

### **Chart.yaml**
```yaml
apiVersion: v2
name: nest-helm
description: A Helm chart for Kubernetes
version: 0.1.0
```

### **values.yaml** (Configuración)
```yaml
app:
  name: nestapi
  image:
    repository: carmen24/nestapi
    tag: latest
    pullPolicy: Always
  container:
    name: nestapi
    port: 3001
    user: "admin-pod"
    sshPort: "2228"
    replicas: 2
  service:
    type: ClusterIP
    port: 3001

ingress:
  enabled: true
  className: nginx
  host: api.carmenasir.com
  path: /

postgres:
  name: nestapi-postgres
  image:
    repository: postgres
    tag: "15-alpine"
  service:
    port: 5432
  auth:
    database: nestapi_db
    username: admin
    password: password
  persistence:
    enabled: true
    size: 2Gi
    storageClassName: "microk8s-hostpath"
```

### **Templates**

**deploy-nestapi.yaml** - Deployment con 2 réplicas

**service-nestapi.yaml** - Service NodePort en puerto 30095

**statefulset-postgres.yaml** - PostgreSQL con persistencia (PVC 2Gi)

**service-postgres.yaml** - Service ClusterIP interno para PostgreSQL

**configmap.yaml** - Variables de entorno (DB_HOST, DB_PORT, DB_NAME, etc.)

**ingress-nestapi.yaml** - Ingress con dominio api.carmenasir.com

---

## 6. Comandos de Despliegue

### **En la VPS:**

```bash
# 1. Navegar al directorio
cd ~/devops/docker/caronte

# 2. Actualizar código (si usas Git)
git pull origin main

# 3. Construir imagen
docker build -t carmen24/nestapi:latest \
  --build-arg INICIALES=crsa \
  --build-arg PROYECTO=nestapi \
  -f ./dockerfiles/js/nest/Dockerfile .

# 4. Subir a Docker Hub
docker login
docker push carmen24/nestapi:latest

# 5. Desplegar con Helm
helm install nestapi ./proyectos/personal/nestdb/deploy/helm \
  -n nest --create-namespace

# 6. Verificar
kubectl get pods -n nest
kubectl get svc -n nest
kubectl get pvc -n nest
kubectl get ingress -n nest
```

---

## 7. Verificación de Ciberseguridad

### **Acceder al pod:**
```bash
kubectl exec -it <nombre-pod> -n nest -- bash
```

### **Comandos de verificación:**
```bash
# 1. Usuario creado
id admin-pod

# 2. Scripts de seguridad heredados
ls -la /root/admin/base/

# 3. Herramientas de ciberseguridad
which fail2ban-client
which nmap

# 4. SSH activo
service ssh status
ps aux | grep ssh

# 5. Logs del sistema
cat /root/logs/informe.log
```

**Salida esperada:**
- Usuario `admin-pod` existe
- Carpetas: `ciber/`, `ssh/`, `usuarios/`, `sudo/`
- fail2ban y nmap instalados
- SSH corriendo

---

## 8. Verificación de PostgreSQL

### **Acceder directamente a PostgreSQL:**
```bash
kubectl exec -it statefull-nestapi-postgres-0 -n nest -- psql -U admin -d nestapi_db
```

### **Comandos SQL:**
```sql
-- Listar tablas
\dt

-- Ver datos de las tablas
SELECT * FROM pelicula LIMIT 5;
SELECT * FROM pokemon LIMIT 5;

-- Salir
\q
```

**Salida esperada:**
```
         List of relations
 Schema |   Name   | Type  | Owner 
--------+----------+-------+-------
 public | pelicula | table | admin
 public | pokemon  | table | admin
```

---

## 9. Pruebas de API REST

### **Acceso general:**
```bash
curl http://api.carmenasir.com
```

### **Endpoints de Películas:**
```bash
# Listar películas
curl http://api.carmenasir.com/pelicula

# Obtener película por ID
curl http://api.carmenasir.com/pelicula/1
```

### **Endpoints de Pokemon:**
```bash
# Listar pokemon
curl http://api.carmenasir.com/pokemon

# Obtener pokemon por ID
curl http://api.carmenasir.com/pokemon/1
```

---

## 10. Comandos Útiles de Helm

```bash
# Ver releases
helm list -n nest

# Ver historial
helm history nestapi -n nest

# Actualizar despliegue
helm upgrade nestapi ./proyectos/personal/nestdb/deploy/helm -n nest

# Reiniciar pods NestJS
kubectl rollout restart deployment deploy-nestapi -n nest

# Reiniciar PostgreSQL
kubectl rollout restart statefulset statefull-nestapi-postgres -n nest

# Ver logs NestJS
kubectl logs -f <pod-nestapi> -n nest

# Ver logs PostgreSQL
kubectl logs -f <pod-postgres> -n nest

# Rollback
helm rollback nestapi -n nest

# Desinstalar
helm uninstall nestapi -n nest
```

---

## 11. Acceso

**URL:** http://api.carmenasir.com

**NodePort:** http://<IP-VPS>:30095

**SSH al pod:** `ssh admin-pod@<IP-VPS> -p 31535`

---

## 12. Especificaciones

| Componente | Valor |
|------------|-------|
| Namespace | nest |
| Imagen NestJS | carmen24/nestapi:latest |
| Imagen PostgreSQL | postgres:15-alpine |
| Réplicas NestJS | 2 |
| Puerto NestJS | 3001 |
| NodePort NestJS | 30095 |
| Puerto PostgreSQL | 5432 |
| Dominio | api.carmenasir.com |
| Usuario Pod | admin-pod |
| Persistencia DB | 2Gi (PVC) |
| StorageClass | microk8s-hostpath |
| Herencia | ubbase → ubsecurity → nestapi |

---

## 13. Troubleshooting

### **Pods no inician:**
```bash
kubectl describe pod <nombre-pod> -n nest
kubectl logs <nombre-pod> -n nest
```

### **PostgreSQL no conecta:**
```bash
# Verificar variables de entorno en el pod NestJS
kubectl exec -it <pod-nestapi> -n nest -- env | grep DB

# Verificar que PostgreSQL está corriendo
kubectl exec -it <pod-postgres> -n nest -- pg_isready -U admin
```

### **Recrear PostgreSQL (perderás datos):**
```bash
# Eliminar StatefulSet y PVC
kubectl delete statefulset statefull-nestapi-postgres -n nest
kubectl delete pvc data-statefull-nestapi-postgres-0 -n nest

# Redesplegar
helm upgrade nestapi ./proyectos/personal/nestdb/deploy/helm -n nest
```

### **Ver estado del PVC:**
```bash
kubectl get pvc -n nest
kubectl describe pvc data-statefull-nestapi-postgres-0 -n nest
```

---

**Documentación actualizada:** 3 de marzo de 2026
