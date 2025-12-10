#!/bin/bash

# Script para automatizar la creación del proyecto React

# TRUCO: Calcular rutas ABSOLUTAS al principio, antes de hacer cd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# DETECCIÓN INTELIGENTE DE RUTAS POR MAYÚSCULAS/MINÚSCULAS
# En local tienes "devops/docker/caronte" (minúsculas)
# En el VPS tienes "devops/Docker/Caronte" (mayúsculas)
# Linux distingue mayúsculas, así que fallaba.

echo "Detectando estructura de carpetas..."

# Buscamos la carpeta 'docker' (case insensitive) dentro de devops
DOCKER_NAME=$(find "$SCRIPT_DIR/devops" -maxdepth 1 -iname "docker" -type d -exec basename {} \; | head -n 1)
if [ -z "$DOCKER_NAME" ]; then echo "Error: No encuentro 'docker' en devops"; exit 1; fi

# Buscamos la carpeta 'caronte' dentro de la carpeta docker encontrada
CARONTE_NAME=$(find "$SCRIPT_DIR/devops/$DOCKER_NAME" -maxdepth 1 -iname "caronte" -type d -exec basename {} \; | head -n 1)
if [ -z "$CARONTE_NAME" ]; then echo "Error: No encuentro 'caronte' en devops/$DOCKER_NAME"; exit 1; fi

# Construimos la base de la ruta
BASE_PATH="$SCRIPT_DIR/devops/$DOCKER_NAME/$CARONTE_NAME"

echo "Ruta base detectada: $BASE_PATH"

PROJECT_DIR="$BASE_PATH/proyectos"
DOCKERFILE_DIR="$BASE_PATH/dockerfiles/react-web"
BASE_IMAGE_DIR="$BASE_PATH/dockerfiles/base"

# COMPROBACIÓN IMAGEN BASE
echo "Verificando imagen base 'ubbase'..."
if [[ "$(docker images -q ubbase:latest 2> /dev/null)" == "" ]]; then
    echo "⚠️  Imagen 'ubbase' no encontrada. Construyéndola..."
    
    # Navegamos a la carpeta RAÍZ de Caronte (BASE_PATH)
    # Porque el Dockerfile 'ubbase' hace COPY de ./dockerfiles/base/admin, etc.
    # Necesita el contexto de la raíz del proyecto.
    CURRENT_LOC=$(pwd)
    cd "$BASE_PATH" || { echo "Error: No encuentro $BASE_PATH"; exit 1; }
    
    echo "Construyendo ubbase desde: $(pwd)"
    
    # Construimos la base apuntando al archivo relativo
    docker build -t ubbase:latest -f dockerfiles/base/ubbase .
    if [ $? -ne 0 ]; then echo "❌ Falló el build de la base"; exit 1; fi
    
    # Volvemos donde estábamos
    cd "$CURRENT_LOC"
else
    echo "✅ Imagen 'ubbase' ya existe."
fi




# Crear directorio si no existe
mkdir -p "$PROJECT_DIR"

# Crear directorio si no existe
mkdir -p "$PROJECT_DIR"

# Navegar al directorio
cd "$PROJECT_DIR" || exit

echo "Creando proyecto React en $PROJECT_DIR/react-web..."

# COMPROBACIÓN: Si no tenemos npm, usamos un contenedor temporal de Node para crear los archivos
if ! command -v npm &> /dev/null; then
    echo "⚠️  NPM no encontrado. Usando Docker temporalmente para generar los archivos..."
    
    # Ejecutamos comando node dentro de un contenedor efímero
    # Mapeamos el directorio actual a /work
    docker run --rm -v "$(pwd):/work" -w /work node:18-alpine \
        sh -c "if [ ! -d 'react-web' ]; then npm create vite@latest react-web -- --template react -y; fi"
        
    echo "✅ Archivos generados con Docker."
    
    # Nota: No hacemos npm install aquí para ahorrar tiempo y espacio, 
    # ya que el Dockerfile final hará su propio npm install.
    cd react-web || exit

else
    # Si tenemos npm local, lo hacemos normal
    if [ -d "react-web" ]; then
        echo "La carpeta 'react-web' ya existe. Saltando creación."
    else
        npm create vite@latest react-web -- --template react -y
    fi

    # Instalar dependencias locales
    cd react-web || exit
    echo "Instalando dependencias..."
    npm install
fi

# --- Construcción Docker ---
echo "--- Construcción Docker ---"
echo "Construyendo imagen Docker..."

# Usamos la variable detectada dinámicamente
DOCKERFILE_PATH="$DOCKERFILE_DIR/Dockerfile"

echo "Buscando Dockerfile en: $DOCKERFILE_PATH"

if [ ! -f "$DOCKERFILE_PATH" ]; then
    echo "ERROR: ¡No se encuentra el Dockerfile!"
    echo "Ruta esperada: $DOCKERFILE_PATH"
    ls -F "$BASE_PATH/dockerfiles"
    exit 1
fi


# Volvemos a la carpeta del proyecto react para el contexto del build
# Asegurarnos de usar la variable PROJECT_DIR
cd "$PROJECT_DIR/react-web" || exit


# Lanzamos el build usando la ruta absoluta calculada
docker build -t react-nginx-app -f "$DOCKERFILE_PATH" .

if [ $? -eq 0 ]; then
    echo "¡Imagen 'react-nginx-app' construida correctamente!"
else
    echo "❌ Error al construir la imagen."
fi

