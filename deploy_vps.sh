#!/bin/bash
# Script para actualizar y desplegar en VPS

set -e

# Detectar ubicación del script y establecer directorio base
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$SCRIPT_DIR"
CARONTE_DIR="$BASE_DIR/devops/Docker/Caronte"

echo "=== Actualizando código desde GitHub ==="
cd "$BASE_DIR"
git pull origin main

echo ""
echo "=== Navegando al directorio de trabajo ==="
cd "$CARONTE_DIR"

echo ""
echo "=== Cargando variables desde .env ==="
if [ -f .env ]; then
    source .env
    # Convertir iniciales a minúsculas
    INICIALES=$(echo "$INICIALES" | tr '[:upper:]' '[:lower:]')
    export INICIALES
    echo "✓ Variables cargadas: INICIALES=$INICIALES, PROYECTO=$PROYECTO"
else
    echo "⚠ No se encontró .env, introduce manualmente:"
    read -p "Iniciales (ej: crsa): " INICIALES
    INICIALES=$(echo "$INICIALES" | tr '[:upper:]' '[:lower:]')
    export INICIALES
fi

echo ""
echo "=== Construyendo imágenes base ==="
docker build --build-arg INICIALES=${INICIALES} -f dockerfiles/base/ubbase -t ${INICIALES}ubbase .
docker build --build-arg INICIALES=${INICIALES} -f dockerfiles/base/ldapbase -t ${INICIALES}ldapbase .
docker build --build-arg INICIALES=${INICIALES} -f dockerfiles/base/dbbase -t ${INICIALES}dbbase .
docker build --build-arg INICIALES=${INICIALES} -f dockerfiles/base/ftpbase -t ${INICIALES}ftpbase .
docker build --build-arg INICIALES=${INICIALES} -f dockerfiles/base/dnsbase -t ${INICIALES}dnsbase .

echo ""
echo "=== Construyendo capas especializadas ==="
docker build --build-arg INICIALES=${INICIALES} -f dockerfiles/base/pbase/ubnginx -t ${INICIALES}ubnginx .
docker build --build-arg INICIALES=${INICIALES} -f dockerfiles/base/pbase/ubreact -t ${INICIALES}ubreact .
docker build --build-arg INICIALES=${INICIALES} -f dockerfiles/base/psecurity/ubsecurity -t ${INICIALES}ubsecurity .
docker build --build-arg INICIALES=${INICIALES} -f dockerfiles/base/psecurity/ubpanel -t ${INICIALES}ubpanel .

echo ""
echo "=== Verificando imágenes creadas ==="
docker images | grep ${INICIALES}

echo ""
echo "=== Construyendo servicios con GUIs ==="
cd proyectos

# FTP + Webmin
echo "Construyendo FTP Server..."
cd ftp-server
docker compose build
cd ..

# DNS + DHCP + Technitium
echo "Construyendo DNS/DHCP Server..."
cd dns-dhcp
docker compose build
cd ..

# PostgreSQL + pgAdmin
echo "Construyendo PostgreSQL..."
cd postgres-admin
docker compose build
cd ..

# React Web
echo "Construyendo proyecto React..."
cd react-web
docker compose build
cd ..

# Cockpit Admin Panel
echo "Construyendo Cockpit..."
cd cockpit
docker compose build
cd ..

echo ""
echo "=== Levantando servicios ==="
(cd ftp-server && docker compose up -d) || true
(cd dns-dhcp && docker compose up -d) || true
(cd postgres-admin && docker compose up -d) || true
(cd react-web && docker compose up -d) || true
(cd cockpit && docker compose up -d) || true

echo ""
echo "=== Verificando contenedores activos ==="
docker ps

echo ""
echo "=== ✅ Despliegue completado ==="
echo ""
echo "Acceso a GUIs web:"
echo "  - FTP (Webmin):          http://161.97.152.19:10000 (root/1234)"
echo "  - DNS/DHCP (Technitium): http://161.97.152.19:5380 (config inicial)"
echo "  - PostgreSQL (pgAdmin):  http://161.97.152.19:5050 (admin@admin.com/admin)"
echo "  - React Web (Nginx):     http://161.97.152.19:8810"
echo "  - React Dev (Node):      http://161.97.152.19:3010"
echo "  - Admin Panel (Cockpit): http://161.97.152.19:9090 (rosa/1234)"
echo ""
echo "Ejecutar health check:"
echo "  docker exec <container> /root/admin/maintenance.sh check"
