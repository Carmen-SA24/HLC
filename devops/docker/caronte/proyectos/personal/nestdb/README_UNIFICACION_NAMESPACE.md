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

| Recurso       | Cantidad   | Release Helm   |
| ------------- | ---------- | -------------- |
| Pods ppokemon | 2          | ppokemon       |
| Pods nestapi  | 2          | nestapi        |
| Pods postgres | 1          | nestapi        |
| **TOTAL**     | **5 pods** | **2 releases** |

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

````
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
````

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

---

## ⚠️ Problema Detectado: Réplica de PostgreSQL Arrancaba Vacía

Al probar la alta disponibilidad de PostgreSQL con 2 réplicas en el StatefulSet, se detectó que al eliminar y recrear el pod-1 (réplica), éste arrancaba **vacío**, sin los datos del primario.

**Causa raíz:** El `start.sh` tenía tres errores críticos:

1. Usaba dos PGDATA distintos: primero `service postgresql start` (usa `/etc/postgresql/*/main/`) y luego intentaba `postgres -D /var/lib/postgresql/data` (directorio diferente → fallo)
2. El usuario `admin` no tenía permisos `REPLICATION`, por lo que `pg_basebackup` era rechazado
3. La réplica ejecutaba `pg_basebackup` **después** de haber arrancado PostgreSQL, siendo imposible limpiar el PGDATA

---

## Solución Implementada: Alta Disponibilidad PostgreSQL (Marzo 2026)

### Arquitectura Final

```
Pod-0: statefull-nestapi-postgres-0  →  PRIMARY  (lectura/escritura + WAL sender)
Pod-1: statefull-nestapi-postgres-1  →  REPLICA  (hot standby, sincronizada via WAL)

NestAPI  →  service nestapi-postgres-rw  →  cualquier pod disponible (port 5432)
Pod-1    →  pg_basebackup               →  statefull-nestapi-postgres-0.<headless-svc>.nest.svc.cluster.local
```

### Cambios Aplicados

#### 1. `dockerfiles/sgbd/postgres/start.sh` — Reescritura completa

- Detecta el rol del pod por ordinal del hostname: `ORDINAL=$(hostname | awk -F'-' '{print $NF}')`
- **Pod-0 (PRIMARY):**
  - Configura `wal_level=replica`, `max_wal_senders=5`, `wal_keep_size=128`, `hot_standby=on`
  - Crea el usuario `admin` con `REPLICATION` explícito: `ALTER USER admin WITH REPLICATION;`
  - Inicia SSH en background y PostgreSQL como servicio
- **Pod-1 (REPLICA):**
  - Espera hasta 5 minutos a que el primary esté disponible (`pg_isready`)
  - Para PostgreSQL si estuviera corriendo
  - Limpia PGDATA y ejecuta `pg_basebackup -R` (genera `standby.signal` + `primary_conninfo`)
  - Arranca PostgreSQL en modo standby automáticamente

#### 2. `templates/configmap-postgres-init.yaml` — Script corregido

- Usa `PGCONF_DIR=$(ls -d /etc/postgresql/*/main | head -n1)` para detectar la ruta real de configuración
- Usa variables de entorno del pod (`$POSTGRES_USER`, `$POSTGRES_PASSWORD`)
- El primary: configura WAL y permite replicación en `pg_hba.conf`
- La réplica: ejecuta `pg_basebackup` con `-R` para configuración automática de standby

#### 3. `templates/statefulset-postgres.yaml` — initContainer

- El script de replicación se ejecuta como **initContainer** (antes del contenedor principal)
- Añadidos `readinessProbe` y `livenessProbe` con `pg_isready`
- El pod-1 no arranca hasta que pod-0 esté `Ready` (garantía del StatefulSet con `OrderedReady`)

#### 4. `templates/service-postgres.yaml` — Dos services

| Service               | Tipo                         | Uso                                                                   |
| --------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `nestapi-postgres`    | `ClusterIP: None` (headless) | DNS entre pods del StatefulSet (`pod-0.nestapi-postgres.nest.svc...`) |
| `nestapi-postgres-rw` | `ClusterIP` normal           | NestAPI conecta aquí → siempre llega a un pod disponible              |

#### 5. `templates/configmap.yaml` — DB_HOST actualizado

```yaml
DB_HOST: "nestapi-postgres-rw" # Antes: nestapi-postgres (headless → no funcionaba bien)
```

### Comandos para Redesplegar

```bash
# En la VPS - reconstruir imagen con el start.sh corregido
cd ~/devops/docker/caronte
git pull origin main

docker build -t carmen24/postgres-ciber:latest \
  --build-arg INICIALES=crsa \
  -f ./dockerfiles/sgbd/postgres/Dockerfile .
docker push carmen24/postgres-ciber:latest

# Borrar PVCs viejos (necesario para limpiar datos del intento anterior)
kubectl delete statefulset statefull-nestapi-postgres -n nest
kubectl delete pvc data-statefull-nestapi-postgres-0 -n nest
kubectl delete pvc data-statefull-nestapi-postgres-1 -n nest   # si existe

# Redesplegar con Helm
helm upgrade nestapi ./proyectos/personal/nestdb/deploy/helm -n nest
```

### Verificar que Funciona

```bash
# Ver los 2 pods de postgres levantados
kubectl get pods -n nest
# ESPERADO:
# statefull-nestapi-postgres-0   1/1   Running   0   ...   <- PRIMARY
# statefull-nestapi-postgres-1   1/1   Running   0   ...   <- REPLICA

# Verificar replicación activa en el PRIMARY
kubectl exec -it statefull-nestapi-postgres-0 -n nest -- \
  su - postgres -c "psql -c 'SELECT * FROM pg_stat_replication;'"
# ESPERADO: 1 fila con la replica conectada

# PRUEBA DE ALTA DISPONIBILIDAD: eliminar pod-0
kubectl delete pod statefull-nestapi-postgres-0 -n nest
# Kubernetes lo recrea. Mientras tanto, la API sigue contestando gracias a pod-1.
curl http://api.carmenasir.com/pokemon   # debe responder con datos

# Ver que pod-0 se recrea solo
kubectl get pods -n nest -w
```

### Resultado Esperado

| Escenario            | Resultado                                                                            |
| -------------------- | ------------------------------------------------------------------------------------ |
| Ambos pods corriendo | PRIMARY acepta escrituras, REPLICA sincronizada en tiempo real                       |
| Pod-0 (primary) cae  | Kubernetes recrea pod-0; pod-1 sigue respondiendo lecturas; la app sigue funcionando |
| Pod-1 (replica) cae  | Kubernetes recrea pod-1; hace `pg_basebackup` del primary y se sincroniza            |
| NestAPI conecta      | Usa `nestapi-postgres-rw` → siempre llega a un pod disponible                        |

---

**Documentación generada:** 5 de marzo de 2026
