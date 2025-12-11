#!/bin/bash

# Script de despliegue automatizado (para ejecutar en el VPS)
# Detecta rutas dinámicamente y levanta la app con Docker Compose

echo "--- Iniciando Despliegue ---"

# 1. Configuración de Rutas (Detección automática de mayúsculas/minúsculas)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Buscar carpetas 'docker' y 'caronte' ignorando mayúsculas
DOCKER_NAME=$(find "$SCRIPT_DIR/devops" -maxdepth 1 -iname "docker" -type d -exec basename {} \; | head -n 1)
CARONTE_NAME=$(find "$SCRIPT_DIR/devops/$DOCKER_NAME" -maxdepth 1 -iname "caronte" -type d -exec basename {} \; | head -n 1)

BASE_PATH="$SCRIPT_DIR/devops/$DOCKER_NAME/$CARONTE_NAME"
PROJECT_DIR="$BASE_PATH/proyectos"
DOCKERFILE_DIR="$BASE_PATH/dockerfiles/react-web"

if [ -z "$DOCKER_NAME" ] || [ -z "$CARONTE_NAME" ]; then
    echo "❌ Error: No se detectó la estructura de carpetas correcta."
    exit 1
fi

# 2. Traer últimos cambios del repositorio
echo "1. Actualizando repositorio..."
git pull origin main

# 3. Preparar el contexto de build
echo "2. Preparando archivos..."
cd "$PROJECT_DIR/react-web" || { echo "❌ No se encuentra el directorio del proyecto"; exit 1; }

# Copiar start.sh necesario para el build
if [ -f "$DOCKERFILE_DIR/start.sh" ]; then
    cp "$DOCKERFILE_DIR/start.sh" .
    echo "✅ start.sh copiado al contexto."
else
    echo "⚠️  Avíso: No se encontró start.sh en $DOCKERFILE_DIR"
fi

# 4. Reconstruir y reiniciar contenedores
echo "3. Reiniciando contenedores (Docker Compose)..."
# Bajar contenedores y borrar imágenes antiguas para forzar rebuild limpio
docker compose down --rmi all 2>/dev/null || true

# Levantar en segundo plano y construir
docker compose up -d --build

if [ $? -eq 0 ]; then
    echo "--- ¡Despliegue Completado! ---"
    echo "La app debería estar corriendo en el puerto 3000."
    echo "Verifica con: docker ps"
else
    echo "❌ Falló el despliegue con Docker Compose."
    exit 1
fi
