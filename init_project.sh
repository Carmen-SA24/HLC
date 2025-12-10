#!/bin/bash

# Script para automatizar la creación del proyecto React

# Definir la ruta donde se creará el proyecto
PROJECT_DIR="devops/docker/caronte/proyectos"

# Crear directorio si no existe
mkdir -p "$PROJECT_DIR"

# Navegar al directorio
cd "$PROJECT_DIR" || exit

echo "Creando proyecto React en $PROJECT_DIR/react-web..."

# Crear el proyecto con Vite (usando flag -y para evitar prompts y --template react)
# Si la carpeta ya existe, npm create vite podría fallar o preguntar.
if [ -d "react-web" ]; then
    echo "La carpeta 'react-web' ya existe. Saltando creación."
else
    npm create vite@latest react-web -- --template react -y
fi

# Instalar dependencias
cd react-web || exit
echo "Instalando dependencias..."
npm install

echo "--- Construcción Docker ---"
echo "Construyendo imagen Docker..."

# Ruta relativa al Dockerfile desde devops/docker/caronte/proyectos/react-web
DOCKERFILE_PATH="../../dockerfiles/react-web/Dockerfile"

# Build de la imagen
docker build -t react-nginx-app -f "$DOCKERFILE_PATH" .

echo "¡Imagen 'react-nginx-app' construida correctamente!"

