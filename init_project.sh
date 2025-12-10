#!/bin/bash

# Script para automatizar la creación del proyecto React

# TRUCO: Calcular rutas ABSOLUTAS al principio, antes de hacer cd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# --- Construcción Docker ---
echo "--- Construcción Docker ---"
echo "Construyendo imagen Docker..."

# Usamos la variable SCRIPT_DIR que calculamos al principio
DOCKERFILE_PATH="$SCRIPT_DIR/devops/docker/caronte/dockerfiles/react-web/Dockerfile"


echo "Buscando Dockerfile en: $DOCKERFILE_PATH"

# DEBUG: Mostrar qué hay realmente para entender por qué falla
echo "--- DEBUG ---"
echo "Script dir: $SCRIPT_DIR"
echo "Contenido de devops/docker/caronte/dockerfiles:"
ls -F "$SCRIPT_DIR/devops/docker/caronte/dockerfiles"
echo "----------------"

if [ ! -f "$DOCKERFILE_PATH" ]; then
    echo "ERROR: ¡No se encuentra el Dockerfile!"
    echo "Verifica que existe en: devops/docker/caronte/dockerfiles/react-web/Dockerfile"
    
    # Intento de búsqueda automático por si la ruta está mal
    echo "Buscando 'Dockerfile' en todo el proyecto:"
    find "$SCRIPT_DIR" -name Dockerfile
    exit 1
fi

# Volvemos a la carpeta del proyecto react para el contexto del build
cd "$SCRIPT_DIR/devops/docker/caronte/proyectos/react-web" || exit

# Lanzamos el build usando la ruta absoluta calculada
docker build -t react-nginx-app -f "$DOCKERFILE_PATH" .

if [ $? -eq 0 ]; then
    echo "¡Imagen 'react-nginx-app' construida correctamente!"
else
    echo "❌ Error al construir la imagen."
fi

