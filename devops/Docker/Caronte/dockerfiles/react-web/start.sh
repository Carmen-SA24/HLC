#!/bin/bash

# Importar funciones base si existen
if [ -f /root/admin/base/usuarios/mainUsuarios.sh ]; then
    source /root/admin/base/usuarios/mainUsuarios.sh
    if [ -f /root/admin/base/admin/start.sh ]; then
        echo "Cargando configuración base..."
    fi
fi

# Iniciar Nginx (Segundo plano)
echo "Iniciando Nginx..."
service nginx start

# Iniciar servidor de desarrollo si existe package.json
if [ -f "/app/package.json" ]; then
    echo "Iniciando servidor de desarrollo en puerto 3000..."
    sleep 2
    cd /app && nohup npm run dev -- --host 0.0.0.0 --port 3000 > /var/log/react-dev.log 2>&1 &
fi

# Iniciar SSHD (Primer plano - Mantiene contenedor vivo)
echo "Iniciando SSHD..."
mkdir -p /run/sshd
exec /usr/sbin/sshd -D
