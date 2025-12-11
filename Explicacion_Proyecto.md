# Guion Técnico para el Vídeo

Este documento sigue el orden lógico de ejecución para que puedas explicarlo paso a paso en tu vídeo.

## 1. La Infraestructura (Imagen Docker)

Primero explicamos cómo se crea el servidor virtual.

### A. Dockerfile (`devops/docker/caronte/dockerfiles/react-web/Dockerfile`)

Es el archivo de configuración que define cómo se construye la imagen del contenedor.

- **Qué hace**: Usa una estrategia **Multi-Stage Build** (Construcción en Etapas) para optimizar la imagen final.
- **Etapa 1 (Builder)**: Usa una imagen `node:22-alpine` para compilar el código React (`npm run build`). Esto genera la carpeta `dist` con la web estática.
- **Etapa 2 (Final)**: Usa la imagen base `ubbase`. Instala **Nginx** (servidor web) y copia solo los archivos compilados (`dist`) de la etapa anterior.
- **Resultado**: Una imagen limpia que contiene Nginx y tu web, lista para desplegar.

### B. start.sh (`devops/docker/caronte/dockerfiles/react-web/start.sh`)

Es el script que se ejecuta automáticamente cuando el contenedor arranca.

- **Qué hace**: Gestiona los procesos dentro del contenedor para que no se apague.
- **Paso 1**: Inicia **Nginx** en segundo plano (`service nginx start`) para servir la web.
- **Paso 2**: Inicia **SSH** en primer plano (`/usr/sbin/sshd -D`).
- **Por qué es importante**: Docker mantiene el contenedor vivo solo mientras el proceso principal siga activo. Al dejar SSH en primer plano, aseguramos que el contenedor permanezca encendido indefinidamente.

---

## 2. Los Scripts de Automatización

Estos scripts orquestan el uso de los archivos anteriores.

### C. init_project.sh

Script de inicialización para preparar el entorno.

- **Función**: Construye la imagen Docker por primera vez.
- **Ejecución**: Lanza el comando `docker build` usando el `Dockerfile` explicado arriba. Si falla la compilación aquí, no se crea la imagen.

### D. deploy.sh

Script de despliegue continuo para actualizar la web en producción.

- **Paso 1**: Ejecuta `git pull` para descargar el último código fuente desde GitHub.
- **Paso 2**: Copia el script `start.sh` al contexto de construcción para asegurar que esté disponible.
- **Paso 3**: Ejecuta `docker compose up -d --build`.
  - `--build`: Fuerza la reconstrucción de la imagen con el nuevo código.
  - `-d`: Arranca el contenedor en modo "Detached".

---

## 3. El Funcionamiento en Segundo Plano

Finalmente, explicamos cómo se mantiene online.

- Gracias al flag `-d` (Detached) en el script de despliegue, el contenedor se ejecuta como un **demonio del sistema** (proceso en segundo plano).
- Esto desacopla el ciclo de vida del contenedor de tu sesión SSH.
- Puedes cerrar la terminal o desconectarte del VPS, y el contenedor seguirá activo porque es un servicio independiente gestionado por el motor de Docker.
