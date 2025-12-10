#!/bin/bash
# init_project.sh
# Script de inicialización para Docker + React + Nginx
# Autor: Antigravity

# 1. Configuración de Rutas (Detección automática de mayúsculas/minúsculas)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔎 Detectando estructura de carpetas..."

# Buscar carpetas 'docker' y 'caronte' ignorando mayúsculas
DOCKER_NAME=$(find "$SCRIPT_DIR/devops" -maxdepth 1 -iname "docker" -type d -exec basename {} \; | head -n 1)
CARONTE_NAME=$(find "$SCRIPT_DIR/devops/$DOCKER_NAME" -maxdepth 1 -iname "caronte" -type d -exec basename {} \; | head -n 1)

BASE_PATH="$SCRIPT_DIR/devops/$DOCKER_NAME/$CARONTE_NAME"
PROJECT_DIR="$BASE_PATH/proyectos"
DOCKERFILE_DIR="$BASE_PATH/dockerfiles/react-web"
BASE_IMAGE_DIR="$BASE_PATH/dockerfiles/base"

# Verificar que encontramos las rutas
if [ -z "$DOCKER_NAME" ] || [ -z "$CARONTE_NAME" ]; then
    echo "❌ Error: No se detectó la estructura de carpetas correcta."
    exit 1
fi

echo "📂 Ruta base: $BASE_PATH"

# 2. Verificar/Construir Imagen Base (ubbase)
if [[ "$(docker images -q ubbase:latest 2> /dev/null)" == "" ]]; then
    echo "🏗️  Imagen 'ubbase' no encontrada. Construyendo..."
    
    PWD_BACKUP=$(pwd)
    cd "$BASE_PATH" || exit
    
    # Construir ubbase desde la raíz del proyecto
    docker build -t ubbase:latest -f dockerfiles/base/ubbase .
    if [ $? -ne 0 ]; then echo "❌ Error al construir 'ubbase'."; exit 1; fi
    
    cd "$PWD_BACKUP"
    echo "✅ Imagen 'ubbase' construida."
else
    echo "✅ Imagen 'ubbase' ya existe."
fi

# 3. Crear Proyecto React (si hace falta)
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR" || exit

if ! command -v npm &> /dev/null; then
    # Opción Docker (si no hay npm local)
    # Si la carpeta está vacía/corrupta, limpiarla para regenerar
    if [ -d "react-web" ] && [ ! -f "react-web/package.json" ]; then
        echo "🧹 Limpiando carpeta react-web incompleta..."
        rm -rf react-web
    fi
    
    if [ ! -d "react-web" ]; then
        echo "📦 Generando archivos React usando Docker..."
        # IMPORTANTE: Usamos -u $(id -u) para crear los archivos con TU usuario, no como root
        docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$(pwd):/work" -w /work node:18-alpine \
            sh -c "npm create vite@latest react-web -- --template react -y"
            
        echo "✅ Proyecto React generado."
    else
        echo "✅ Proyecto React ya existe."
    fi
else
    # Opción Local
    if [ ! -d "react-web" ]; then
        echo "📦 Creando proyecto React localmente..."
        npm create vite@latest react-web -- --template react -y
        cd react-web && npm install && cd ..
    fi
fi

# 4. Construir Imagen Final (React App)
echo "🚀 Construyendo imagen de la aplicación..."
cd "$PROJECT_DIR/react-web" || exit

# Copiar start.sh al contexto de build (necesario para el Dockerfile)
echo "📋 Copiando script de inicio..."
cp "$DOCKERFILE_DIR/start.sh" .

# Construir imagen
docker build -t react-nginx-app -f "$DOCKERFILE_DIR/Dockerfile" .

if [ $? -eq 0 ]; then
    echo "🎉 ¡ÉXITO! La imagen 'react-nginx-app' está lista."
    echo "👉 Ejecuta 'bash deploy.sh' para levantar el servidor."
else
    echo "❌ Error al construir la imagen final."
    exit 1
fi
