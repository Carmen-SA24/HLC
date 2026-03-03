## 🐳 Guía de Despliegue API NestJS: Pokémon & Películas (PostgreSQL + Docker + K8s/Helm)

Este proyecto consiste en la migración de una API de NestJS de MySQL a **PostgreSQL** y su posterior despliegue automatizado mediante **Docker Compose** y **Kubernetes (Helm)** en el entorno Caronte.

---

## 📂 Estructura de Archivos Necesarios

Para que el sistema funcione, los archivos están organizados así:

1.  **`proyectos/nestapi/`**: Contiene el código fuente de la aplicación (clonado de GitHub).
2.  **`proyectos/personal/nestdb/`**: Carpeta principal de despliegue.
    - `.env`: variables de configuración.
    - `docker-compose.yml`: orquestación local/provisional.
    - `kubernetes/nest-helm/`: carpetas del Chart de Helm para el despliegue final.
3.  **`dockerfiles/js/nest/`**:
    - `Dockerfile`: Receta para construir la imagen (usa Node 22).
    - `start.sh`: Script que arranca la aplicación dentro del contenedor.

---

## ⚙️ Variables de Configuración (.env)

Hemos configurado puertos específicos para **evitar conflictos** con otros contenedores en la VPS:

| Variable        | Valor     | Descripción                                |
| :-------------- | :-------- | :----------------------------------------- |
| `PORT_NODE`     | **3015**  | Puerto público para acceder a la API.      |
| `PORT_POSTGRES` | **5433**  | Puerto público para la base de datos.      |
| `PORT_SSH`      | **2228**  | Puerto interno del contenedor para SSH.    |
| `NODEPORT_SSH`  | **31535** | Puerto externo de la VPS para SSH directo. |
| `NODEPORT_API`  | **30095** | Puerto externo de la VPS para API directa. |
| `FIRMA`         | carmen24  | Tu usuario de Docker Hub.                  |

---

## 🛠️ Flujo de Trabajo (Paso a Paso)

### 1. Preparación en Local (PC Windows)

```powershell
git add .
git commit -m "mensaje de los cambios"
git push origin main
```

### 2. Actualización en la VPS

```bash
cd ~/devops/docker/caronte
git pull origin main
```

### 3. Despliegue con Docker Compose (Prueba)

```bash
cd proyectos/personal/nestdb
docker compose up -d --build
```

### 4. Despliegue Final en Kubernetes (Helm)

1. **Subir a Docker Hub**:

```bash
docker login
docker push carmen24/nestapi:latest
```

2. **Instalar con Helm**:

```bash
cd kubernetes
helm upgrade --install nest ./nest-helm -n nest --create-namespace
```

---

## 🔍 Comandos de Verificación

- **Ver logs de NestJS**: `docker compose logs -f nestapi`
- **Ver estado en Kubernetes**: `kubectl get all -n nest`
- **Acceso a la API (Docker Compose)**: `http://161.97.152.19:3015`
- **Acceso a la API (Kubernetes NodePort)**: `http://161.97.152.19:30095`
- **Acceso Directo por SSH (Sin kubectl)**: `ssh -p 31535 admin-pod@161.97.152.19`
  - `/` -> Debería mostrar `Hello World!` (mensaje de bienvenida).
  - `/pokemon` -> Lista de Pokémon en formato JSON.
  - `/peliculas` -> Lista de Películas en formato JSON.

---

## 🗄️ Gestión de la Base de Datos (pgAdmin Web)

Puedes gestionar la base de datos desde la herramienta web **pgAdmin 4** instalada en el servidor.

### 1. Acceso a la herramienta pgAdmin

- **URL**: http://161.97.152.19:5050
- **Usuario (Email)**: `admin@admin.com`
- **Contraseña**: `admin`

### 2. Pasos para conectar a la BD de Kubernetes:

Una vez dentro de pgAdmin:

1. Clic derecho en **"Servers"** -> **Register** -> **Server...**
2. Pestaña **"General"**:
   - **Name**: `NestAPI-K8s` (o el que prefieras)
3. Pestaña **"Connection"**:
   - **Host name/address**: `161.97.152.19`
   - **Port**: `5433` (Puerto NodePort del servicio Postgres)
   - **Maintenance database**: `nestapi_db`
   - **Username**: `admin`
   - **Password**: `password`
4. Dale a **Save** y ya verás tus tablas de Pokémon y Películas.

---

## 🧪 Métodos para Poblar la Base de Datos

Existen dos formas principales de llenar tu base de datos con los Pokémon y Películas.

### Método A: A través de la API (Recomendado para clase)

Este método demuestra que tu código NestJS funciona correctamente. Usamos `curl` desde la VPS para "engañar" al Pod y que se inserte datos a sí mismo.

**1. Insertar un Pokémon único (Prueba rápida):**

```bash
POD_NAME=$(kubectl get pods -n nest -l app=nestapi -o jsonpath="{.items[0].metadata.name}")
kubectl exec -it $POD_NAME -n nest -- /bin/bash -c "curl -X POST http://localhost:3001/pokemon -H 'Content-Type: application/json' -d '{\"nombre\":\"Pikachu\",\"tipo\":\"Electrico\",\"hp\":35,\"ataque\":55,\"defensa\":40,\"sp_atk\":50,\"sp_def\":50,\"velocidad\":90}'"
```

**2. Insertar TODO el catálogo (Carga masiva):**
Este comando lee los archivos JSON que ya tienes en el proyecto y los envía uno a uno:

```bash
# Cargar todos los Pokémon
kubectl exec -it $POD_NAME -n nest -- /bin/bash -c "apt-get update && apt-get install -y jq && jq -c '.[]' /app/ejemplos-pokemon.json | while read i; do curl -X POST http://localhost:3001/pokemon -H 'Content-Type: application/json' -d \"\$i\"; done"

# Cargar todas las Películas
kubectl exec -it $POD_NAME -n nest -- /bin/bash -c "jq -c '.[]' /app/ejemplos-peliculas.json | while read i; do curl -X POST http://localhost:3001/peliculas -H 'Content-Type: application/json' -d \"\$i\"; done"
```

---

### Método B: Desde pgAdmin (Directo a la BD)

Este método es útil para realizar consultas rápidas o borrar datos.

1.  **Conexión**: Sigue los pasos de la sección "Gestión de la Base de Datos" de arriba.
2.  **Dónde encontrar las tablas**: Navega en el árbol de la izquierda: `Servers` -> `NestAPI-K8s` -> `Databases` -> `nestapi_db` -> `Schemas` -> `public` -> `Tables`.
3.  **Añadir Datos (Visual)**:
    - Haz clic derecho en la tabla (ej. `pokemon`) -> **View/Edit Data** -> **All Rows**.
    - Puedes escribir directamente en la última fila vacía y pulsar F6 o el icono de "Save" para guardar.
4.  **Añadir Datos (SQL)**:
    - Haz clic derecho en la tabla -> **Query Tool**.
    - Pega y ejecuta (F5) un código como este:
    ```sql
    INSERT INTO pokemon (nombre, tipo, hp, ataque, defensa, sp_atk, sp_def, velocidad)
    VALUES ('Charmander', 'Fuego', 39, 52, 43, 60, 50, 65);
    ```
5.  **Crear nuevas Tablas**:
    - Aunque NestJS las crea solo, si quieres una manual: Clic derecho en `Tables` -> **Create** -> **Table...**.
    - O por SQL en la **Query Tool**:
    ```sql
    CREATE TABLE inventario (
        id SERIAL PRIMARY KEY,
        item VARCHAR(100),
        cantidad INTEGER
    );
    ```

---

## � Guía de Inserción de Datos (Postman)

Una vez que la API esté desplegada, sigue estos pasos para cargar información en la base de datos PostgreSQL:

### 1. Configuración de la Petición

- **Método**: `POST`
- **URL**: `http://161.97.152.19:30095/pokemon` ó `http://161.97.152.19:30095/peliculas`
  - Si usas el dominio: `https://api.carmenasir.com/pokemon`

### 2. Configuración del Cuerpo (Body)

En Postman, selecciona debajo de la barra de direcciones:

1. Pestaña **Body**
2. Opción **raw**
3. Tipo **JSON** (menú desplegable a la derecha)

### 3. Ejemplo de JSON para insertar

**Pokémon:**

```json
{
  "nombre": "Pikachu",
  "tipo": "Eléctrico",
  "hp": 90,
  "ataque": 110,
  "defensa": 70,
  "sp_atk": 100,
  "sp_def": 80,
  "velocidad": 120
}
```

**Película:**

```json
{
  "title": "Inception",
  "director": "Christopher Nolan",
  "year": 2010,
  "length_minutes": 148
}
```

### 4. Verificación

1. Haz clic en **Send**.
2. Si recibes un status **`201 Created`**, los datos han viajado desde tu PC hasta el servidor y se han guardado en PostgreSQL.
3. Para confirmar, realiza una petición **`GET`** a la misma URL y verás los datos listados.

### ⚠️ Notas importantes

- **Sincronización**: `synchronize: true` está activo via `DB_SYNC=true` en el ConfigMap → las tablas se crean solas al iniciar el servidor.
- **Variables de Entorno**: La conexión a Postgres se configura a través del ConfigMap de Kubernetes (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`).

---

## ⚡ Guía Rápida: Postman

Postman funciona como un navegador pero muestra los datos del servidor en lugar de una web.

**GET** (ver datos):

```
GET http://161.97.152.19:30095/pokemon
```

→ Dale a **Send** y verás el listado en JSON.

**POST** (insertar datos):

```
POST http://161.97.152.19:30095/pokemon
Body → raw → JSON
```

**Códigos de respuesta:**

| Código             | Significado                             |
| ------------------ | --------------------------------------- |
| `201 Created`      | ✅ Dato guardado en Postgres            |
| `200 OK`           | ✅ Datos recibidos correctamente        |
| `400 Bad Request`  | ❌ JSON mal formado o campo inválido    |
| `404 Not Found`    | ❌ URL mal escrita                      |
| `500 Server Error` | ❌ Error en el código o BD no conectada |

---

## �🔍 Verificación

### 0. Persistencia de la Base de Datos (StatefulSet + Volumen)

PostgreSQL **no usa un Deployment** sino un **StatefulSet**, porque necesita que los datos sobrevivan a reinicios.

```
StatefulSet (statefull-nestapi-postgres)
    └── Pod postgres
          └── volumeMount → /var/lib/postgresql/data   ← datos de la BD
                └── PVC (PersistentVolumeClaim, 2Gi)   ← volumen de Kubernetes
                      └── StorageClass: microk8s-hostpath ← disco real del nodo
```

**Verificar el volumen y el StatefulSet:**

```bash
# Ver el StatefulSet corriendo
kubectl get statefulset -n nest

# Ver el PVC (PersistentVolumeClaim) creado automáticamente
kubectl get pvc -n nest

# Ver el PV (PersistentVolume) real en el nodo
kubectl get pv
```

**Salida esperada:**

```
NAME                          STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS        AGE
data-statefull-nestapi-...    Bound    pvc-...  2Gi        RWO            microk8s-hostpath   Xm
```

> ✅ El estado `Bound` confirma que el volumen está montado y los datos **persisten aunque el pod se reinicie**.

---

### 1. Ver la Jerarquía de Imágenes

La imagen de NestJS hereda en cadena:

```
ubuntu:latest
    └── crsaubbase:latest       ← crea usuario del sistema + SSH
          └── crsaubsecurity:latest  ← ciberseguridad + auditoría
                └── carmen24/nestapi:latest  ← Node.js 22 + NestJS ← NUESTRA IMAGEN
```

Esto está declarado en el `Dockerfile`:

```dockerfile
FROM ${INICIALES}ubsecurity:latest   # hereda de crsaubsecurity
```

---

### 2. Acceder al Pod con `kubectl exec` (Método Rápido)

Este método es útil para diagnósticos rápidos sin salir de la sesión de la VPS.

```bash
# Obtener el nombre del pod automáticamente y entrar de forma segura
kubectl exec -it -n nest $(kubectl get pod -l app=nestapi -n nest -o name) -- /bin/bash
```

---

### 3. Dentro del Pod: Verificar el Usuario `admin-pod`

Hemos configurado un usuario específico dentro del Pod diferente al de la VPS para demostrar el aislamiento de seguridad.

Una vez dentro del pod (`kubectl exec`), ejecutar:

```bash
# Verificar que el usuario 'admin-pod' existe
id admin-pod

# Salida esperada:
# uid=1001(admin-pod) gid=1001(admin-pod) groups=1001(admin-pod)

# Comprobar que tiene asignado el password '1234' (aunque no lo veamos)
# El prompt debe mostrar: admin-pod@deploy-nestapi-...
```

---

### 4. SSH Sin Trucos: Acceso Directo por NodePort

Esta es la demostración definitiva de ciberseguridad: acceder al interior del contenedor desde el mundo exterior a través de un puerto mapeado por Kubernetes.

**Comando desde la terminal de la VPS (Host) o desde tu PC local:**

Este comando debe ejecutarse fuera del Pod, en la terminal principal de tu servidor para demostrar que la "puerta" (NodePort) está abierta al mundo.

```bash
# Conexión directa al puerto 31535 mapeado al SSH del Pod
ssh -p 31535 admin-pod@161.97.152.19
```

- **Usuario**: `admin-pod` (Diferente a `rosa` para evitar confusiones).
- **Password**: `1234`
- **Puerto Externo**: `31535` (Configurado en `service-nestapi.yaml`).
- **Puerto Interno**: `2228` (Donde escucha el servidor SSH en el contenedor).

**¿Por qué entra a veces sin contraseña?**
Si entras desde la VPS, los scripts de seguridad de clase pueden haber sincronizado tus llaves SSH. Para **forzar** que te pida la contraseña y demostrar que funciona, usa:

```bash
ssh -o PubkeyAuthentication=no -p 31535 admin-pod@161.97.152.19
```

---

### 5. Verificación de Servicios

Dentro del pod o mediante SSH, podemos verificar que todo el motor está encendido:

```bash
# Ver que el proceso sshd está corriendo en el puerto 2228
ps aux | grep sshd

# Ver que la API de NestJS responde localmente
curl http://localhost:3001/pokemon
```

---

🏁 **Despliegue y configuración de ciberseguridad finalizados con éxito por Carmen y Antigravity.**
