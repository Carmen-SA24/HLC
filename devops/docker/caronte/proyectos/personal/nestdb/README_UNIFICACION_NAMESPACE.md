# Unificación de Namespaces - ppokemon y nestapi

## Situación Inicial

Los proyectos estaban desplegados en namespaces separados:
- **ppokemon** → namespace `proyectopokemon`
- **nestapi** → namespace `nest`

Se decide unificarlos en un **único namespace común**: `nest`.

---

## Estado Inicial

```bash
# Verificar deployments en diferentes namespaces
kubectl get pods -n proyectopokemon
# OUTPUT: 2 pods de ppokemon

kubectl get pods -n nest
# OUTPUT: 2 pods de nestapi + 1 pod de postgres
```

Los proyectos estaban en 2 namespaces diferentes.

---

## Solución Implementada

### Decisión: Usar namespace "nest" como namespace común

Se eligió el namespace `nest` porque:
1. Ya contenía nestapi con PostgreSQL y datos
2. Evita pérdida de datos de la base de datos
3. Solo requiere mover ppokemon (más simple)

---

## Comandos Ejecutados

### 1. Actualizar código desde GitHub
```bash
cd ~/devops/docker/caronte
git pull origin main
```
**Propósito:** Asegurar que tenemos las últimas versiones de los templates Helm.

---

### 2. Desinstalar ppokemon del namespace original
```bash
helm uninstall ppokemon -n proyectopokemon
```
**Propósito:** 
- Eliminar la release de Helm de ppokemon en `proyectopokemon`
- Liberar el NodePort 30083 (los NodePorts son globales en el clúster)
- Preparar para reinstalar en el nuevo namespace

**Nota:** Esto NO elimina la imagen Docker (sigue en Docker Hub), solo los recursos de Kubernetes.

---

### 3. Limpiar secret de Helm (si existe conflicto)
```bash
# Verificar si hay releases de ppokemon
helm list -A | grep ppokemon

# Ver secrets de Helm
kubectl get secrets -n nest | grep ppokemon

# Eliminar secret si existe
kubectl delete secret -n nest -l name=ppokemon
```
**Propósito:** Eliminar metadatos de Helm que puedan causar conflictos al reinstalar con el mismo nombre.

---

### 4. Instalar ppokemon en namespace "nest"
```bash
helm install ppokemon ./proyectos/ppokemon/deploy/helm -n nest
```
**Propósito:** 
- Desplegar ppokemon en el namespace `nest` (donde ya está nestapi)
- Helm usa `{{ .Release.Namespace }}` en los templates, por lo que automáticamente crea los recursos en `nest`
- La imagen Docker `carmen24/ppokemon:latest` se descarga desde Docker Hub

**Importante:** El parámetro `-n nest` indica el namespace destino. Los templates de Helm tienen `namespace: {{ .Release.Namespace }}` que se sustituye por "nest".

---

### 5. Verificar unificación
```bash
# Ver todos los pods en namespace "nest"
kubectl get pods -n nest
# OUTPUT: 5 pods
#   - 2 deploy-ppokemon
#   - 2 deploy-nestapi
#   - 1 statefull-nestapi-postgres

# Ver releases de Helm en "nest"
helm list -n nest
# OUTPUT:
#   nestapi (deployed)
#   ppokemon (deployed)
```

---

### 6. Eliminar namespace viejo
```bash
kubectl delete namespace proyectopokemon
```
**Propósito:** Limpiar el namespace vacío que ya no se usa.

---

## Resultado Final

### Namespace: `nest`

```bash
rosa@vmi2811860:~/devops/docker/caronte$ kubectl get pods -n nest
NAME                               READY   STATUS    RESTARTS   AGE
deploy-nestapi-65864bf5c5-4r6t8    1/1     Running   0          11h
deploy-nestapi-65864bf5c5-sq9n8    1/1     Running   0          11h
deploy-ppokemon-6c7856ffcb-d4ldh   1/1     Running   0          12h
deploy-ppokemon-6c7856ffcb-sfdf6   1/1     Running   0          12h
statefull-nestapi-postgres-0       1/1     Running   0          11h
```

### Recursos en namespace "nest":
| Recurso | Cantidad | Release Helm |
|---------|----------|--------------|
| Pods ppokemon | 2 | ppokemon |
| Pods nestapi | 2 | nestapi |
| Pods postgres | 1 | nestapi |
| **TOTAL** | **5 pods** | **2 releases** |

### Servicios:
```bash
kubectl get svc -n nest
# - service-ppokemon (NodePort 30083)
# - service-nestapi (NodePort 30095)
# - nestapi-postgres (ClusterIP 5432)
```

### Ingress:
```bash
kubectl get ingress -n nest
# - ingress-ppokemon → pokemon.carmenasir.com
# - ingress-nestapi → api.carmenasir.com
```

---

## Acceso a Pods Individuales

Aunque ambos proyectos están en el mismo namespace, **los pods siguen siendo independientes**:

```bash
# Listar pods con nombres completos
kubectl get pods -n nest

# Entrar al pod de ppokemon (Next.js)
kubectl exec -it deploy-ppokemon-6c7856ffcb-d4ldh -n nest -- bash

# Entrar al primer pod de nestapi (NestJS)
kubectl exec -it deploy-nestapi-65864bf5c5-4r6t8 -n nest -- bash

# Entrar al segundo pod de nestapi (NestJS)
kubectl exec -it deploy-nestapi-65864bf5c5-sq9n8 -n nest -- bash

# Entrar al pod de postgres
kubectl exec -it statefull-nestapi-postgres-0 -n nest -- bash
```
### **Comandos de verificación**
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

# 6. Comprobar alta disponibilidad (eliminar un pod)
# Ver los pods actuales
kubectl get pods -n nest

# Eliminar uno de los dos pods de NestJS
kubectl delete pod deploy-nestapi-65864bf5c5-4r6t8 -n nest

# Ver cómo se recrea automáticamente
kubectl get pods -n nest

# La API sigue funcionando (el otro pod atendía las peticiones)
curl http://api.carmenasir.com/peliculas

```
Cada pod tiene:
- Su propio contenedor aislado
- Su propio usuario:
  - **ppokemon**: `admin-pokemon`
  - **nestapi**: `admin-pod`
  - **postgres**: `admin-pod`
- Sus propios procesos (Next.js, NestJS o PostgreSQL)
- Herramientas de ciberseguridad heredadas de `ubsecurity`

---

## Por Qué Funcionó

### 1. Templates con {{ .Release.Namespace }}
Los templates de Helm usan variables dinámicas:
```yaml
metadata:
  namespace: {{ .Release.Namespace }}
```
Cuando ejecutas `helm install -n nest`, Helm sustituye automáticamente con "nest".

### 2. Imágenes en Docker Hub
Las imágenes Docker están en Docker Hub:
- `carmen24/ppokemon:latest`
- `carmen24/nestapi:latest`
- `carmen24/postgres-ciber:latest`

Al reinstalar, Kubernetes descarga las imágenes desde Docker Hub, por lo que **no se pierde nada**.

### 3. NodePorts Globales
Los NodePorts (30083, 30095) son **globales** en el clúster, no por namespace. Por eso había que eliminar el ppokemon viejo antes de crear el nuevo.

### 4. StatefulSet con Persistencia
PostgreSQL usa StatefulSet con PVC (PersistentVolumeClaim). El volumen persiste aunque se elimine el pod, manteniendo los datos.

---

## Comandos de Gestión Post-Unificación

### Ver todo en el namespace unificado:
```bash
kubectl get all -n nest
```

### Actualizar cualquier proyecto:
```bash
# Actualizar ppokemon
helm upgrade ppokemon ./proyectos/ppokemon/deploy/helm -n nest

# Actualizar nestapi
helm upgrade nestapi ./proyectos/personal/nestdb/deploy/helm -n nest
```

### Reiniciar pods sin perder datos:
```bash
# Reiniciar ppokemon
kubectl rollout restart deployment deploy-ppokemon -n nest

# Reiniciar nestapi
kubectl rollout restart deployment deploy-nestapi -n nest

# Reiniciar postgres (mantiene datos en PVC)
kubectl rollout restart statefulset statefull-nestapi-postgres -n nest
```

### Ver logs de cualquier pod:
```bash
kubectl logs -f deploy-ppokemon-XXXX -n nest
kubectl logs -f deploy-nestapi-XXXX -n nest
kubectl logs -f statefull-nestapi-postgres-0 -n nest
```

---

## Resumen del Proceso

**ANTES:**
- ppokemon en namespace `proyectopokemon`
- nestapi en namespace `nest`
- 2 namespaces separados

**DESPUÉS:**
- ppokemon en namespace `nest`
- nestapi en namespace `nest`
- 1 namespace común

**Método ejecutado:**
1. Desinstalar ppokemon del namespace `proyectopokemon`
2. Reinstalar ppokemon en namespace `nest`
3. Eliminar namespace `proyectopokemon` (vacío)

**Resultado:** Ambos proyectos funcionando en el mismo namespace con herencia de ciberseguridad mantenida.

---

**Documentación generada:** 3 de marzo de 2026


------------
⚠️ Advertencia: Al probar la replicación de PostgreSQL con StatefulSet, al eliminar uno de los pods, el nuevo pod se regeneraba vacío (sin los datos del primario). El objetivo era que ambos pods tuvieran los mismos datos, pero la replicación no funcionó como se esperaba. Por este motivo se realizaron todos los cambios y refuerzos documentados a continuación.

Cambios Técnicos y Refuerzos (Marzo 2026)

Refuerzo de start.sh en PostgreSQL: Se añadió un bloque al final del script para evitar que el pod termine si falla PostgreSQL: 
```bash
exec su - postgres -c "postgres -D /var/lib/postgresql/data" || { echo "ERROR: Falló el arranque de PostgreSQL. El pod se mantiene vivo para evitar entrypoint heredado." >> /root/logs/informe.log tail -f /dev/null }
```

Motivo: Evitar CrashLoopBackOff y que se ejecute el entrypoint heredado (docker-entrypoint.sh) al heredar de la imagen de seguridad.

Dockerfile custom PostgreSQL: Confirmado ENTRYPOINT ["/start.sh"] para sobrescribir el entrypoint de la base. Motivo: Mantener la herencia de seguridad y evitar comandos heredados no deseados.

Revisión de manifiestos Helm/Kubernetes: Verificado que no hay referencias a docker-entrypoint.sh en los YAML ni en los scripts de replicación. Motivo: Documentar que la causa del error no está en los manifiestos, sino en la cadena de herencia de la imagen.

Documentación de troubleshooting: Se documenta el proceso de refuerzo y verificación para futuras incidencias.

Fecha: 5 de marzo de 2026

Copia este bloque y pégalo al final de tu README.



