#!/bin/bash

# Script de despliegue automatizado (para ejecutar en el VPS)

echo "--- Iniciando Despliegue ---"

# 1. Traer últimos cambios del repositorio
echo "1. Actualizando repositorio..."
git pull origin main

# 2. Navegar a la carpeta del proyecto
# Asumimos que este script está en la raíz del repo. Ajustamos ruta.
cd devops/docker/caronte/proyectos/react-web || exit

# 3. Reconstruir y reiniciar contenedores
echo "2. Reiniciando contenedores..."
# Bajar contenedores y borrar imágenes antiguas para forzar rebuild limpio
docker compose down --rmi all

# Levantar en segundo plano y construir
docker compose up -d --build

echo "--- ¡Despliegue Completado! ---"
echo "La app debería estar corriendo en el puerto 3000."
