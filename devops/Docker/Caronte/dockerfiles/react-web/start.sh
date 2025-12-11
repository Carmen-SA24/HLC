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


# Iniciar SSHD (Primer plano - Mantiene contenedor vivo)
echo "Iniciando SSHD..."
mkdir -p /run/sshd
exec /usr/sbin/sshd -D
