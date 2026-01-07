#!/bin/bash
# Script para detener todos los servicios

echo "=== Deteniendo servicios ==="

cd devops/Docker/Caronte/proyectos

cd ftp-server && docker compose down && cd ..
cd dns-dhcp && docker compose down && cd ..
cd postgres-admin && docker compose down && cd ..
cd react-web && docker compose down && cd ..

echo ""
echo "=== Servicios detenidos ==="
docker ps
