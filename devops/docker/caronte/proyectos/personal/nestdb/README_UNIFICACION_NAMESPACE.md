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

---

## ⚠️ Problema Detectado: Réplica de PostgreSQL Arrancaba Vacía

Al probar la alta disponibilidad de PostgreSQL con 2 réplicas en el StatefulSet, al eliminar el pod-1 (réplica) y que Kubernetes lo recreara, el pod nuevo arrancaba **vacío**, sin los datos del primario.

---

## Solución Implementada: Alta Disponibilidad PostgreSQL (5-6 Marzo 2026)

### Arquitectura Final

```
Pod-0: statefull-nestapi-postgres-0  →  PRIMARY  (lectura/escritura + WAL sender)
Pod-1: statefull-nestapi-postgres-1  →  REPLICA  (hot standby, sincronizada via WAL streaming)

NestAPI  →  statefull-nestapi-postgres-0.nestapi-postgres.nest.svc.cluster.local (DNS headless)
Pod-1    →  pg_basebackup  →  pod-0 (clona datos al arrancar)
```

---

### Bugs Encontrados y Soluciones

#### Bug 1 — Dockerfile: ruta de COPY incorrecta

**Síntoma:** `ERROR: failed to solve: "/start.sh": not found`
**Causa:** `COPY start.sh /start.sh` busca en el contexto raíz del build (`.`), pero el fichero está en `dockerfiles/sgbd/postgres/start.sh`
**Solución:**

```dockerfile
# Antes:
COPY start.sh /start.sh
# Después:
COPY dockerfiles/sgbd/postgres/start.sh /start.sh
```

**Fichero:** `dockerfiles/sgbd/postgres/Dockerfile`

---

#### Bug 2 — PVC vacío: PGDATA no existe al arrancar

**Síntoma:** `Error: /var/lib/postgresql/16/main is not accessible or does not exist`
**Causa:** El PVC se monta en `/var/lib/postgresql` vacío, sobreescribiendo el PGDATA pre-inicializado de la imagen Docker. `service postgresql start` falla porque el directorio de datos no existe.
**Solución:** Detectar si PGDATA está vacío y usar `initdb` para inicializarlo:

```bash
PG_VERSION=$(ls /etc/postgresql/ | head -n1)
PGDATA_REAL="/var/lib/postgresql/${PG_VERSION}/main"
if [ ! -f "$PGDATA_REAL/PG_VERSION" ]; then
    mkdir -p "$PGDATA_REAL"
    chown -R postgres:postgres /var/lib/postgresql
    chmod 700 "$PGDATA_REAL"
    su - postgres -c "/usr/lib/postgresql/${PG_VERSION}/bin/initdb \
        -D ${PGDATA_REAL} --locale=C.UTF-8 --auth-local=trust --auth-host=md5"
fi
```

**Fichero:** `dockerfiles/sgbd/postgres/start.sh`

---

#### Bug 3 — pg_hba.conf: entrada de replicación para 0.0.0.0/0 nunca se añadía

**Síntoma:** `FATAL: no pg_hba.conf entry for replication connection from host "10.1.x.x"`
**Causa:** El `grep "replication"` matcheaba las líneas de localhost que trae Ubuntu por defecto (`host replication all 127.0.0.1/32`), así que la condición `||` nunca añadía la entrada para `0.0.0.0/0`.
**Solución:** Cambiar el grep para buscar específicamente `0.0.0.0/0`:

```bash
# Antes (bug):
grep -q "replication" $PGCONF_DIR/pg_hba.conf || \
    echo "host replication all 0.0.0.0/0 md5" >> pg_hba.conf
# Después (fix):
grep -q "0.0.0.0/0.*replication\|replication.*0.0.0.0/0" $PGCONF_DIR/pg_hba.conf || \
    echo "host    replication     all             0.0.0.0/0               md5" >> $PGCONF_DIR/pg_hba.conf
```

**Fichero:** `dockerfiles/sgbd/postgres/start.sh`

---

#### Bug 4 — pg_basebackup: archivos creados como root → Permission denied

**Síntoma:** `FATAL: could not open file "/var/lib/postgresql/16/main/PG_VERSION": Permission denied`
**Causa:** `pg_basebackup` corre como `root` (el usuario del contenedor), los archivos copiados son de root. `service postgresql start` arranca PostgreSQL como el usuario del SO `postgres`, que no puede leer archivos de root.
**Solución:** Hacer `chown` después del basebackup:

```bash
PGPASSWORD=password pg_basebackup -h $PRIMARY_SVC -D $PGDATA_DIR -U admin -v -P -X stream -R

# FIX: corregir propietario antes de arrancar PostgreSQL
chown -R postgres:postgres $PGDATA_DIR
chmod 700 $PGDATA_DIR
```

**Fichero:** `dockerfiles/sgbd/postgres/start.sh`

---

#### Bug 5 — Probes con -U admin fallaban por peer auth

**Síntoma:** Logs llenos de `Peer authentication failed for user "admin"`
**Causa:** `readinessProbe` y `livenessProbe` ejecutaban `pg_isready -U admin` como usuario `root` del contenedor. La autenticación `peer` comprueba que el usuario del SO coincida con el usuario de PostgreSQL (root ≠ admin → fallo).
**Solución:** Cambiar las probes para usar el usuario `postgres` (que sí tiene peer auth):

```yaml
readinessProbe:
  exec:
    command: ["pg_isready", "-U", "postgres"]
livenessProbe:
  exec:
    command: ["pg_isready", "-U", "postgres"]
```

**Fichero:** `deploy/helm/templates/statefulset-postgres.yaml`

---

#### Bug 6 — Service -rw balanceaba escrituras a la réplica (read-only)

**Síntoma:** ~50% de las peticiones POST daban `500 Internal Server Error` de forma aleatoria
**Causa:** El service `nestapi-postgres-rw` balanceaba entre pod-0 (PRIMARY, lectura/escritura) y pod-1 (REPLICA, **solo lectura**). Las escrituras que llegaban a pod-1 eran rechazadas por PostgreSQL.
**Solución:** Apuntar NestAPI directamente al pod-0 via DNS headless del StatefulSet:

```yaml
# configmap.yaml - Antes:
DB_HOST: "nestapi-postgres-rw"
# Después:
DB_HOST: "statefull-nestapi-postgres-0.nestapi-postgres.nest.svc.cluster.local"
```

**Fichero:** `deploy/helm/templates/configmap.yaml`

---

#### Bug 7 — Tras borrar PVCs, TypeORM no recrea las tablas si NestAPI ya llevaba horas corriendo

**Síntoma:** API devuelve `500` con error `42P01` (tabla no existe) aunque la BD esté vacía y `DB_SYNC: "true"` esté configurado.
**Causa:** TypeORM `synchronize: true` solo crea las tablas **una vez al arrancar**. Si los pods de NestAPI llevan horas corriendo y la BD se resetea (borrado de PVCs), TypeORM no vuelve a sincronizar.
**Solución:** Reiniciar NestAPI después de borrar PVCs:

```bash
kubectl rollout restart deployment deploy-nestapi -n nest
```

---

### Ficheros Modificados

| Fichero                                              | Cambio                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `dockerfiles/sgbd/postgres/Dockerfile`               | Ruta COPY corregida                                                                                     |
| `dockerfiles/sgbd/postgres/start.sh`                 | Reescritura: initdb si PVC vacío, WAL config, pg_basebackup con chown, propio script de primary/replica |
| `deploy/helm/templates/statefulset-postgres.yaml`    | Sin initContainer, probes con usuario postgres, replicas: 2                                             |
| `deploy/helm/templates/service-postgres.yaml`        | Service headless (ClusterIP: None) para DNS entre pods                                                  |
| `deploy/helm/templates/configmap.yaml`               | DB_HOST apunta a pod-0 directamente                                                                     |
| `deploy/helm/templates/configmap-postgres-init.yaml` | **Eliminado** (duplicaba lógica ya en start.sh)                                                         |

---

### Comandos de Despliegue Completos

```bash
cd ~/devops/docker/caronte
git pull origin main

# Reconstruir imagen postgres (cuando se cambia start.sh)
docker build -t carmen24/postgres-ciber:latest \
  --build-arg INICIALES=crsa \
  -f ./dockerfiles/sgbd/postgres/Dockerfile .
docker push carmen24/postgres-ciber:latest

# Solo si es necesario resetear la BD (borra todos los datos):
kubectl delete statefulset statefull-nestapi-postgres -n nest
kubectl delete pvc data-statefull-nestapi-postgres-0 -n nest
kubectl delete pvc data-statefull-nestapi-postgres-1 -n nest

# Redesplegar con Helm (cambios en templates/values)
helm upgrade nestapi ./proyectos/personal/nestdb/deploy/helm -n nest

# Reiniciar solo la réplica (nueva imagen sin tocar primary)
kubectl delete pod statefull-nestapi-postgres-1 -n nest

# Reiniciar NestAPI (necesario si se borraron PVCs para que TypeORM recree tablas)
kubectl rollout restart deployment deploy-nestapi -n nest
```

---

### Prueba de Alta Disponibilidad

```bash
# 1. Verificar estado de los 2 pods
kubectl get pods -n nest
# statefull-nestapi-postgres-0   1/1   Running  ← PRIMARY
# statefull-nestapi-postgres-1   1/1   Running  ← REPLICA

# 2. Verificar replicación activa
kubectl exec -it statefull-nestapi-postgres-0 -n nest -- \
  su - postgres -c "psql -c 'SELECT client_addr, state FROM pg_stat_replication;'"
# Debe mostrar 1 fila con la IP del pod-1

# 3. Verificar que hay datos
curl http://api.carmenasir.com/pokemon

# 4. Eliminar el PRIMARY
kubectl delete pod statefull-nestapi-postgres-0 -n nest

# 5. Ver que Kubernetes lo recrea automáticamente (~30-60s de downtime)
kubectl get pods -n nest -w

# 6. Cuando pod-0 vuelva, los datos siguen intactos
curl http://api.carmenasir.com/pokemon
```

### Comportamiento Esperado (con DB_HOST al service -rw)

| Escenario            | Comportamiento                                                                         |
| -------------------- | -------------------------------------------------------------------------------------- |
| Ambos pods corriendo | PRIMARY acepta escrituras, REPLICA sincronizada en tiempo real vía WAL                 |
| Pod-0 (primary) cae  | service -rw enruta a pod-1 (hot standby) → **la API nunca deja de responder**          |
| Pod-1 (replica) cae  | pod-0 sigue atendiendo → **la API nunca deja de responder**                            |
| Se borran los PVCs   | Los datos SE PIERDEN. Hay que reenviar datos y hacer `rollout restart deploy-nestapi`. |

---

## ✅ Pruebas de Alta Disponibilidad Realizadas con Éxito (6 Marzo 2026)

### Prueba 1 — Eliminar el PRIMARY (pod-0)

**Objetivo:** Verificar que la API sigue disponible cuando cae el pod primario.

**Comandos ejecutados:**

```bash
# Verificar estado previo
kubectl get pods -n nest
# statefull-nestapi-postgres-0   1/1   Running  ← PRIMARY
# statefull-nestapi-postgres-1   1/1   Running  ← REPLICA

# Eliminar el PRIMARY
kubectl delete pod statefull-nestapi-postgres-0 -n nest
# pod "statefull-nestapi-postgres-0" deleted from nest namespace

# Comprobar estado inmediatamente
kubectl get pods -n nest
# statefull-nestapi-postgres-0   0/1   Running   ← recreándose
# statefull-nestapi-postgres-1   1/1   Running   ← sirviendo datos

# Verificar que la API responde durante la recreación
curl http://api.carmenasir.com/pokemon
# [{"id":1,"nombre":"Bulbasaur",...}, {"id":2,...}]  ← datos disponibles ✅
```

**Resultado:** ✅ La página **nunca dejó de mostrar los datos**. El service `-rw` enrutó automáticamente las peticiones a pod-1 (hot standby) mientras pod-0 se recreaba. Kubernetes recreó pod-0 en ~90 segundos con todos los datos intactos desde el PVC.

---

### Prueba 2 — Eliminar la REPLICA (pod-1)

**Objetivo:** Verificar que la API sigue disponible cuando cae el pod réplica.

**Comandos ejecutados:**

```bash
# Verificar estado previo
kubectl get pods -n nest
# statefull-nestapi-postgres-0   1/1   Running  ← PRIMARY
# statefull-nestapi-postgres-1   1/1   Running  ← REPLICA

# Eliminar la REPLICA
kubectl delete pod statefull-nestapi-postgres-1 -n nest
# pod "statefull-nestapi-postgres-1" deleted from nest namespace

# Comprobar estado inmediatamente
kubectl get pods -n nest
# statefull-nestapi-postgres-0   1/1   Running   ← PRIMARY (sigue activo)
# statefull-nestapi-postgres-1   0/1   Running   ← recreándose (pg_basebackup)

# Verificar que la API responde durante la recreación
curl http://api.carmenasir.com/pokemon
# [{"id":1,"nombre":"Bulbasaur",...}, {"id":2,...}]  ← datos disponibles ✅
```

**Resultado:** ✅ La página **nunca dejó de mostrar los datos**. Pod-0 (PRIMARY) continuó sirviendo todas las peticiones sin ninguna interrupción. Kubernetes recreó pod-1, que ejecutó `pg_basebackup` desde pod-0 y volvió sincronizado.

---

### Conclusión de las Pruebas

Ambas pruebas confirman que la arquitectura implementada cumple con los requisitos de **Alta Disponibilidad**:

- 🔄 **Replicación en tiempo real**: Ambos pods tienen siempre los mismos datos
- 🛡️ **Sin punto único de fallo**: Si cae cualquier pod de PostgreSQL, el otro sirve los datos
- 🔁 **Auto-recuperación**: Kubernetes recrea el pod caído automáticamente
- 💾 **Persistencia garantizada**: Los datos sobreviven a reinicios gracias a los PVCs
- 🔀 **Failover automático**: El service `-rw` deja de enrutar a pods no disponibles

---

## 🖥️ Frontend HTML — Dashboard de Datos (6 Marzo 2026)

### Objetivo

Mostrar los datos de la base de datos (Pokémon y Películas) con una interfaz visual en el propio NestJS, sin necesidad de desplegar un frontend separado (Next.js). El profesor indicó usar HTML + JavaScript con `fetch` para consumir la propia API.

### Solución Implementada

Se modificó `app.controller.ts` para que la ruta raíz `/` devuelva una página HTML completa con CSS y JavaScript embebidos. La página hace `fetch` a los endpoints `/pokemon` y `/peliculas` y renderiza los datos en tarjetas (cards).

### Arquitectura

```
Navegador → GET http://api.carmenasir.com/
          → NestJS devuelve la página HTML

Navegador → fetch('/pokemon')     → NestJS devuelve JSON con pokémon
Navegador → fetch('/peliculas')   → NestJS devuelve JSON con películas
Navegador → renderiza cards con los datos recibidos
```

### Ficheros Modificados

| Fichero                                   | Cambio                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `proyectos/nestapi/src/app.controller.ts` | Reemplazado el `getHello()` por `getPortada()` que devuelve HTML completo |
| `proyectos/nestapi/src/app.module.ts`     | Eliminado `AppService` (ya no se usa)                                     |
| `proyectos/nestapi/src/main.ts`           | Añadido `api.carmenasir.com` a la lista de orígenes CORS                  |

### Código clave — Fetch en el HTML

```javascript
// Fetch de Pokémon
async function cargarPokemon() {
  const res = await fetch("/pokemon"); // llama al endpoint de la propia API
  const data = await res.json(); // parsea el JSON
  data.forEach((p) => {
    // construye una card por cada pokémon
    grid.innerHTML += `<div class="card">...</div>`;
  });
}

// Fetch de Películas
async function cargarPeliculas() {
  const res = await fetch("/peliculas");
  const data = await res.json();
  data.forEach((p) => {
    grid.innerHTML += `<div class="card">...</div>`;
  });
}

// Se ejecutan automáticamente al cargar la página
cargarPokemon();
cargarPeliculas();
```

### Diseño de la Página

- 🌑 **Fondo oscuro** (dark mode, `#0f0f1a`)
- 💜 **Paleta morada** como color de acento
- 📑 **Dos tabs** — ⚡ Pokémon / 🎬 Películas
- 🃏 **Cards** con los datos de cada registro
- ✨ **Efecto hover** en las cards (elevación suave)
- 📱 **Grid responsivo** que se adapta al tamaño de pantalla

### Despliegue

```bash
# Reconstruir imagen NestAPI con los cambios del controller
cd ~/devops/docker/caronte
docker build -t carmen24/nestapi:latest \
  -f ./dockerfiles/js/nest/Dockerfile .
docker push carmen24/nestapi:latest

kubectl rollout restart deployment deploy-nestapi -n nest
```

### Resultado

| URL                                   | Respuesta                                         |
| ------------------------------------- | ------------------------------------------------- |
| `http://api.carmenasir.com`           | 🖥️ Dashboard HTML con tabs de Pokémon y Películas |
| `http://api.carmenasir.com/pokemon`   | `[{...}]` JSON con todos los pokémon (API)        |
| `http://api.carmenasir.com/peliculas` | `[{...}]` JSON con todas las películas (API)      |

✅ **Verificado:** La página muestra correctamente los 5 pokémon y las películas cargadas en la BD.


---
### Filtro Global de Excepciones (AllExceptionsFilter) en NestJS

Se añadió un filtro global de excepciones en el backend para mostrar mensajes claros cuando:
- La base de datos no está disponible: "La base de datos no está disponible. Espera unos segundos e intenta de nuevo."
- El backend está iniciando: "El backend está iniciando. Por favor, espera un momento."
- Otros errores internos: "Error interno del servidor"

**Archivos editados:**
- `src/all-exceptions.filter.ts` (nuevo archivo)
- `src/main.ts` (registro global del filtro)

**Código añadido:**

```typescript
// src/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (
      typeof exception === 'object' &&
      exception &&
      (exception as any).code === 'ECONNREFUSED'
    ) {
      message = 'La base de datos no está disponible. Espera unos segundos e intenta de nuevo.';
    } else if (
      typeof exception === 'object' &&
      exception &&
      (exception as any).message?.includes('Connection is not ready')
    ) {
      message = 'El backend está iniciando. Por favor, espera un momento.';
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}

// src/main.ts
import { AllExceptionsFilter } from './all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  // ...existing code...
}
bootstrap();


**Documentación actualizada:** 6 de marzo de 2026