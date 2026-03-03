# Despliegue de ppokemon con Helm - Next.js con Ciberseguridad

Proyecto Next.js desplegado en Kubernetes usando Helm, con herencia de capas de seguridad desde ubsecurity.

---

## 1. Estructura de Archivos

```
ppokemon/
├── src/                              # Código fuente Next.js
├── deploy/
│   └── helm/                         # Helm chart
│       ├── Chart.yaml                # Metadatos del chart
│       ├── values.yaml               # Configuración parametrizable
│       └── templates/                # Plantillas Kubernetes
│           ├── deploy-ppokemon.yaml  # Deployment
│           ├── service-ppokemon.yaml # Service NodePort
│           └── ingress-ppokemon.yaml # Ingress
└── dockerfiles/js/next/
    ├── Dockerfile                    # Construcción de imagen
    └── start.sh                      # Script de arranque
```

---

## 2. Dockerfile - Herencia de Capas

**Ubicación:** `dockerfiles/js/next/Dockerfile`

### **Etapa 1: Builder (Compilación)**
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY proyectos/ppokemon/src/package*.json ./
RUN npm install
COPY proyectos/ppokemon/src/ .
RUN npm run build
```
- Compila la aplicación Next.js
- Genera build optimizado

### **Etapa 2: Runtime (Herencia de ubsecurity)**
```dockerfile
FROM ubsecurity:latest          # ← HERENCIA DE CIBERSEGURIDAD

ENV USUARIO=admin-pokemon
ENV PASSWORD=1234
ENV PORT_SSH=22

RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app
WORKDIR /app
COPY dockerfiles/js/next/start.sh /start-pokemon.sh
RUN chmod +x /start-pokemon.sh

EXPOSE 3000 22
ENTRYPOINT ["/start-pokemon.sh"]
```

**Herencia completa:**
```
ubbase (Ubuntu base) 
  └─> ubsecurity (fail2ban, nmap, SSH, usuarios)
       └─> ppokemon (Next.js + Node.js)
```

---

## 3. Script de Arranque

**Ubicación:** `dockerfiles/js/next/start.sh`

```bash
#!/bin/bash
# Iniciar Next.js en background
cd /app && npm start &

# Iniciar script base de seguridad (de ubsecurity)
exec /root/admin/base/start.sh
```

**Funciones:**
- Arranca Next.js en puerto 3000
- Ejecuta scripts de ciberseguridad heredados
- Crea usuario admin-pokemon
- Inicia SSH

---

## 4. Helm Chart

### **Chart.yaml**
```yaml
apiVersion: v2
name: ppokemon-helm
description: A Helm chart for Pokemon Next.js application
version: 0.1.0
```

### **values.yaml** (Configuración)
```yaml
app:
  name: ppokemon
  image:
    repository: carmen24/ppokemon
    tag: latest
    pullPolicy: Always
  container:
    name: webpokemon
    port: 3000
    replicas: 2
  service:
    type: NodePort
    port: 80
    nodePort: 30083

ingress:
  enabled: true
  className: nginx
  hosts:
    - pokemon.carmenasir.com
  path: /
```

### **Templates**

**deploy-ppokemon.yaml** - Define el Deployment con 2 réplicas

**service-ppokemon.yaml** - Service tipo NodePort en puerto 30083

**ingress-ppokemon.yaml** - Ingress con dominio pokemon.carmenasir.com

---

## 5. Comandos de Despliegue

### **En la VPS:**

```bash
# 1. Navegar al directorio
cd ~/devops/docker/caronte

# 2. Actualizar código (si usas Git)
git pull origin main

# 3. Construir imagen
docker build -t carmen24/ppokemon:latest -f ./dockerfiles/js/next/Dockerfile .

# 4. Subir a Docker Hub
docker login
docker push carmen24/ppokemon:latest

# 5. Desplegar con Helm
helm install ppokemon ./proyectos/ppokemon/deploy/helm -n proyectopokemon --create-namespace

# 6. Verificar
kubectl get pods -n proyectopokemon
kubectl get svc -n proyectopokemon
kubectl get ingress -n proyectopokemon
```

---

## 6. Verificación de Ciberseguridad

### **Acceder al pod:**
```bash
kubectl exec -it <nombre-pod> -n proyectopokemon -- bash
```

### **Comandos de verificación:**
```bash
# 1. Usuario creado
id admin-pokemon

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
- Usuario `admin-pokemon` existe
- Carpetas: `ciber/`, `ssh/`, `usuarios/`, `sudo/`
- fail2ban y nmap instalados
- SSH corriendo

---

## 7. Comandos Útiles de Helm

```bash
# Ver releases
helm list -n proyectopokemon

# Ver historial
helm history ppokemon -n proyectopokemon

# Actualizar
helm upgrade ppokemon ./proyectos/ppokemon/deploy/helm -n proyectopokemon

# Reiniciar pods
kubectl rollout restart deployment deploy-ppokemon -n proyectopokemon

# Rollback
helm rollback ppokemon -n proyectopokemon

# Desinstalar
helm uninstall ppokemon -n proyectopokemon
```

---

## 8. Acceso

**URL:** http://pokemon.carmenasir.com

**NodePort:** http://<IP-VPS>:30083

---

## 9. Especificaciones

| Componente | Valor |
|------------|-------|
| Namespace | proyectopokemon |
| Imagen | carmen24/ppokemon:latest |
| Réplicas | 2 |
| Puerto Next.js | 3000 |
| NodePort | 30083 |
| Dominio | pokemon.carmenasir.com |
| Usuario Pod | admin-pokemon |
| Herencia | ubbase → ubsecurity → ppokemon |
