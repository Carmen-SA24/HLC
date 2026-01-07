#!/bin/bash
# Script para actualizar y desplegar en VPS

set -e

echo "=== Actualizando código desde GitHub ==="
git pull origin main

echo ""
echo "=== Navegando al directorio de trabajo ==="
cd devops/Docker/Caronte

echo ""
echo "=== Definir tus iniciales ==="
read -p "Introduce tus iniciales (ej: crsa): " INICIALES_INPUT
INICIALES=$(echo "$INICIALES_INPUT" | tr '[:upper:]' '[:lower:]')
export INICIALES
echo "Usando iniciales: $INICIALES"

echo ""
echo "=== Construyendo imágenes base ==="
docker build -f dockerfiles/base/ubbase -t ${INICIALES}ubbase .
docker build -f dockerfiles/base/ldapbase -t ${INICIALES}ldapbase .
docker build -f dockerfiles/base/dbbase -t ${INICIALES}dbbase .
docker build -f dockerfiles/base/ftpbase -t ${INICIALES}ftpbase .
docker build -f dockerfiles/base/dnsbase -t ${INICIALES}dnsbase .

echo ""
echo "=== Construyendo capas especializadas ==="
docker build -f dockerfiles/base/ubnginx -t ${INICIALES}ubnginx .
docker build -f dockerfiles/base/ubAutocaravaneando -t ${INICIALES}ubAutocaravaneando .
docker build -f dockerfiles/base/ubsecurity -t ${INICIALES}ubsecurity .
docker build -f dockerfiles/base/ubpanel -t ${INICIALES}ubpanel .

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

echo ""
echo "=== Levantando servicios ==="
cd ftp-server && docker compose up -d && cd ..
cd dns-dhcp && docker compose up -d && cd ..
cd postgres-admin && docker compose up -d && cd ..
cd react-web && docker compose up -d && cd ..

echo ""
echo "=== Verificando contenedores activos ==="
docker ps

echo ""
echo "=== ✅ Despliegue completado ==="
echo ""
echo "Acceso a GUIs web:"
echo "  - FTP (Webmin):          http://IP_VPS:10000"
echo "  - DNS/DHCP (Technitium): http://IP_VPS:5380"
echo "  - PostgreSQL (pgAdmin):  http://IP_VPS:5050"
echo "  - React Web (Nginx):     http://IP_VPS:8810"
echo "  - React Dev (Node):      http://IP_VPS:3010"
echo ""
echo "Ejecutar health check:"
echo "  docker exec <container> /root/admin/maintenance.sh check"
