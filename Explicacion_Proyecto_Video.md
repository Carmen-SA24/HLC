# Guion Técnico para el Vídeo (VERSIÓN EXTENDIDA)

Aquí tienes la versión un poco más larga (aprox. 1 minuto y medio) con indicaciones de qué mostrar en pantalla:

### 1. Intro (Muestra tu terminal en el VPS)

_"El proyecto utiliza una infraestructura automatizada en Docker. Para ponerlo en marcha, he utilizado dos scripts clave."_

### 2. init_project.sh (Muestra el código del script o su ejecución)

_"Primero, el script `init_project.sh`. Este se encarga de preparar todo el entorno inicial. Detecta las rutas del proyecto, verifica que la imagen base exista y realiza la **primera construcción** de la imagen Docker."_

### 3. El Dockerfile (Muestra el archivo Dockerfile en pantalla)

\*"La construcción de la imagen se define aquí, en el Dockerfile. He utilizado una **Multi-Stage Build** (construcción en dos etapas):

- En la primera etapa, uso Node.js para compilar mi código React y generar la web estática.
- En la segunda etapa, copio solo esa web terminada a una imagen final limpia con Nginx.
  Esto hace que el servidor final sea mucho más ligero y seguro."\*

### 4. deploy.sh (Muestra la ejecución del deploy)

_"Para las actualizaciones y el despliegue final, utilizo el script `deploy.sh`. Este script descarga los últimos cambios con `git`, prepara los archivos necesarios como el `start.sh`, y lanza la reconstrucción automática."_

### 5. start.sh y Segundo Plano (Muestra el archivo start.sh)

_"Dentro del contenedor, este script `start.sh` levanta Nginx para servir la web y mantiene el contenedor encendido ejecutando SSH en primer plano.
Todo esto se ejecuta con `docker compose up -d`, lo que deja la aplicación funcionando en segundo plano de forma permanente."_

### 6. Cierre (Muestra la web funcionando en el navegador)

_"Como resultado, la web está accesible y el servicio se mantiene estable independientemente de mi sesión."_
