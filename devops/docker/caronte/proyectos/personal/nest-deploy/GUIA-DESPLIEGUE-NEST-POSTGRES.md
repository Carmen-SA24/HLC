## 🐳 Guía de Despliegue API NestJS: Pokémon & Películas (PostgreSQL + Docker + K8s/Helm)

Este proyecto consiste en la migración de una API de NestJS de MySQL a **PostgreSQL** y su posterior despliegue automatizado mediante **Docker Compose** y **Kubernetes (Helm)** en el entorno Caronte.

---

## 📂 Estructura de Archivos Necesarios

Para que el sistema funcione, los archivos están organizados así:

1.  **`proyectos/nestapi/`**: Contiene el código fuente de la aplicación (clonado de GitHub).
2.  **`proyectos/personal/nest-deploy/`**: Carpeta principal de despliegue.
    - `.env`: variables de configuración.
    - `docker-compose.yml`: orquestación local/provisional.
    - `kubernetes/nest-helm/`: carpetas del Chart de Helm para el despliegue final.
3.  **`dockerfiles/js/nest/`**:
    - `Dockerfile`: Receta para construir la imagen (usa Node 22).
    - `start.sh`: Script que arranca la aplicación dentro del contenedor.

---

## ⚙️ Variables de Configuración (.env)

Hemos configurado puertos específicos para **evitar conflictos** con otros contenedores en la VPS:

| Variable        | Valor    | Descripción                           |
| :-------------- | :------- | :------------------------------------ |
| `PORT_NODE`     | **3015** | Puerto público para acceder a la API. |
| `PORT_POSTGRES` | **5433** | Puerto público para la base de datos. |
| `PORT_SSH`      | **2228** | Puerto para acceso SSH al contenedor. |
| `DB_PORT`       | 5432     | Puerto interno (no cambiar).          |
| `FIRMA`         | carmen24 | Tu usuario de Docker Hub.             |

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
cd proyectos/personal/nest-deploy
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
- **Acceso a la API (Kubernetes)**: `http://161.97.152.19:30095`
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

🏁 **Despliegue finalizado con éxito por Carmen y Antigravity.**
