# Arquitectura de Despliegue y Flujo de Comunicación - Proyecto Pokémon

Este proyecto implementa una arquitectura basada en microservicios contenerizados y orquestados mediante Kubernetes, siguiendo un modelo de capas de seguridad heredadas.

---

## 1. Construcción de la Imagen (Dockerfile Multietapa)

La imagen Docker del proyecto "ppokemon" utiliza una estrategia **Multi-stage Build** para optimización y seguridad:

### **Etapa 1: Builder (Compilación)**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY src/package*.json ./
RUN npm install
COPY src/ .
RUN npm run build
```

### **Etapa 2: Runtime (Ejecución con Ubsecurity)**

```dockerfile
FROM ubsecurity:latest

ENV USUARIO=rosa
ENV PASSWORD=1234
ENV PORT_SSH=22

# Instalar Node.js y npm
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copiar aplicación construida
COPY --from=builder /app /app
WORKDIR /app

# Copiar script de arranque
COPY ./deploy/start-pokemon.sh /start-pokemon.sh
RUN chmod +x /start-pokemon.sh

EXPOSE 3000 22
ENTRYPOINT ["/start-pokemon.sh"]
```

### **Script de Arranque (`start-pokemon.sh`)**

```bash
#!/bin/bash
# Iniciar Next.js en background
cd /app && npm start &

# Iniciar script base de seguridad
exec /root/admin/base/start.sh
```

**Características clave:**

- Hereda de `ubsecurity:latest` (incluye fail2ban, nmap, usuario rosa)
- Ejecuta Next.js con SSR en puerto 3000
- Mantiene activa la capa de seguridad

---

## 2. Cambios Realizados en el Proyecto

### **deploy/dockerfile**

**Cambio:** De `ubsecurity + Nginx` a `ubsecurity + Node.js`

**Antes:**

```dockerfile
FROM ubsecurity:latest
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/out /var/www/html/
```

**Después:**

```dockerfile
FROM ubsecurity:latest
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app /app
```

**Razón:** Next.js con SSR necesita Node.js, no archivos estáticos con Nginx.

---

### **deploy/start-pokemon.sh**

**Cambio:** De iniciar Nginx a iniciar Node.js

**Antes:**

```bash
#!/bin/bash
nginx -g 'daemon off;' &
exec /root/admin/base/start.sh
```

**Después:**

```bash
#!/bin/bash
cd /app && npm start &
exec /root/admin/base/start.sh
```

**Razón:** Ejecutar el servidor Next.js en lugar de servir archivos estáticos.

---

### **deploy/kubernetes/service-pokemon.yml**

**Cambio:** Puerto de destino actualizado

**Antes:**

```yaml
ports:
  - port: 80
    targetPort: 80
    nodePort: 30083
```

**Después:**

```yaml
ports:
  - port: 80
    targetPort: 3000
    nodePort: 30083
```

**Razón:** Next.js corre en el puerto 3000, no en el 80 como Nginx.

---

## 3. Manifiestos de Kubernetes

### **namespace-pokemon.yml**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: proyectopokemon
  labels:
    name: proyectopokemon
```

### **deploy-pokemon.yml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pokemon-deployment
  namespace: proyectopokemon
spec:
  replicas: 2
  selector:
    matchLabels:
      app: webpokemon
  template:
    metadata:
      labels:
        app: webpokemon
    spec:
      containers:
        - name: webpokemon
          image: carmen24/ppokemon:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "256Mi"
```

### **service-pokemon.yml**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: pokemon-service
  namespace: proyectopokemon
spec:
  type: NodePort
  selector:
    app: webpokemon
  ports:
    - port: 80
      targetPort: 3000
      nodePort: 30083
```

### **ingress-pokemon.yml**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pokemon-ingress
  namespace: proyectopokemon
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: pokemon.carmenasir.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: pokemon-service
                port:
                  number: 80
    - host: www.carmenasir.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: pokemon-service
                port:
                  number: 80
```

---

## 4. Configuración DNS (Arsys)

**Registros A creados:**

- `pokemon.carmenasir.com` → `161.97.152.19`

**TTL:** 3600 segundos (1 hora)

---

## 5. Comandos de Despliegue

### **En LOCAL (Windows):**

```bash
# Commit de cambios
git add -A
git commit -m "fix: cambiar ppokemon de Nginx a Node.js para soportar SSR"
git push origin main
```

### **En VPS:**

```bash
# 1. Navegar al proyecto
cd ~/caronte/proyectos/ppokemon

# 2. Construir imagen Docker
docker build -t carmen24/ppokemon:latest -f deploy/dockerfile .

# 3. Subir a Docker Hub
docker login
docker push carmen24/ppokemon:latest

# 4. Aplicar manifiestos Kubernetes
kubectl apply -f deploy/kubernetes/

# 5. Verificar despliegue
kubectl get pods -n proyectopokemon
kubectl get svc -n proyectopokemon
kubectl get ingress -n proyectopokemon

# 6. Ver logs (opcional)
kubectl logs -n proyectopokemon -l app=webpokemon --tail=50
```

---

## 6. Flujo de una Petición Web

```
Usuario (www.carmenasir.com)
    ↓
DNS Arsys (161.97.152.19)
    ↓
Nginx Ingress Controller (VPS)
    ↓
Service pokemon-service (NodePort 30083)
    ↓
Pod 1 o Pod 2 (Next.js :3000)
    ↓
Respuesta HTML renderizada
```

**Paso a paso:**

1. Usuario escribe `www.carmenasir.com`
2. DNS resuelve a `161.97.152.19`
3. Ingress lee `Host: pokemon.carmenasir.com` → enruta a `pokemon-service`
4. Service balancea entre 2 pods
5. Next.js procesa la petición con SSR
6. Usuario recibe HTML renderizado

---

## 7. Verificación del Despliegue

### **Desde el VPS:**

```bash
# Por NodePort
curl http://localhost:30083

# Por dominio
curl -H "Host: carmenasir.com" http://161.97.152.19
```

### **Desde el navegador:**

- http://pokemon.carmenasir.com

---

## 8. Arquitectura Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET (Usuario)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              www.carmenasir.com
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  DNS (Arsys)                                 │
│              Registro A → 161.97.152.19                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  VPS (161.97.152.19)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Nginx Ingress Controller                      │  │
│  │  (Lee Host: carmenasir.com → pokemon-service)         │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Kubernetes Service (pokemon-service)                │  │
│  │   NodePort: 30083 | TargetPort: 3000                  │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                    │
│         ┌───────────────┴───────────────┐                   │
│         ▼                               ▼                   │
│  ┌─────────────┐                 ┌─────────────┐           │
│  │   Pod 1     │                 │   Pod 2     │           │
│  │ ┌─────────┐ │                 │ ┌─────────┐ │           │
│  │ │ Next.js │ │                 │ │ Next.js │ │           │
│  │ │ :3000   │ │                 │ │ :3000   │ │           │
│  │ └─────────┘ │                 │ └─────────┘ │           │
│  │ ┌─────────┐ │                 │ ┌─────────┐ │           │
│  │ │ubsecurity│ │                 │ │ubsecurity│ │           │
│  │ └─────────┘ │                 │ └─────────┘ │           │
│  └─────────────┘                 └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Especificaciones Técnicas

| Componente               | Valor                    |
| ------------------------ | ------------------------ |
| **Namespace**            | proyectopokemon          |
| **Imagen Docker**        | carmen24/ppokemon:latest |
| **Réplicas**             | 2                        |
| **Puerto Interno**       | 3000 (Next.js)           |
| **NodePort**             | 30083                    |
| **Dominio**              | pokemon.carmenasir.com   |
| **IP VPS**               | 161.97.152.19            |
| **CPU Request/Limit**    | 100m / 500m              |
| **Memory Request/Limit** | 128Mi / 256Mi            |

---

## 10. Estado Final

✅ **Desplegado y accesible en:** http://pokemon.carmenasir.com  
✅ **Alta disponibilidad:** 2 réplicas activas  
✅ **Seguridad:** Capa ubsecurity heredada  
✅ **SSR:** Next.js con renderizado del lado del servidor
