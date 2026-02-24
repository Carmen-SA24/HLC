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
- **Acceso a la API**: `http://161.97.152.19:3015`
  - `/` -> Debería mostrar `Hello World!` (mensaje de bienvenida).
  - `/pokemon` -> Lista de Pokémon en formato JSON.
  - `/peliculas` -> Lista de Películas en formato JSON.

---

## 🗄️ Gestión de la Base de Datos (PostgreSQL)

Para gestionar las tablas y los datos, puedes usar **pgAdmin Web** ya instalado en tu servidor:

### Pasos para conectar pgAdmin:

1. Entra en: `http://161.97.152.19:5050`
2. Clic derecho en **"Servers"** (panel izquierdo) -> **Register** -> **Server...**
3. En la pestaña **"General"**, ponle un nombre: `NestAPI-DB`
4. En la pestaña **"Connection"**, usa estos datos:
   - **Host**: `161.97.152.19`
   - **Puerto**: `5433` (Puerto externo configurado)
   - **Maintenance database**: `nestasir_db`
   - **Username**: `admin`
   - **Password**: `password`
5. Dale a **Save** y ya verás tus tablas de Pokémon y Películas.

---

## 🔍 Comandos de Verificación
