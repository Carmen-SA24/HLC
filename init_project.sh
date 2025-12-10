#!/bin/bash

# Script para automatizar la creación del proyecto React

# Definir la ruta donde se creará el proyecto
PROJECT_DIR="devops/docker/caronte/proyectos"

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

echo "--- Construcción Docker ---"
echo "Construyendo imagen Docker..."

# Ruta relativa al Dockerfile desde devops/docker/caronte/proyectos/react-web
DOCKERFILE_PATH="../../dockerfiles/react-web/Dockerfile"

# Build de la imagen
docker build -t react-nginx-app -f "$DOCKERFILE_PATH" .

echo "¡Imagen 'react-nginx-app' construida correctamente!"

