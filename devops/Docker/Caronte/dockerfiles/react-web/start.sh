#!/bin/bash

# Importamos las funciones de usuario del script base (si existen en la ruta esperada)
if [ -f /root/admin/base/usuarios/mainUsuarios.sh ]; then
    source /root/admin/base/usuarios/mainUsuarios.sh
    # Re-ejecutamos creación de usuario si es necesario (lógica de ubbase)
    # Nota: Depende de cómo ubbase gestione esto. Si ubbase ya creó el usuario al construir, esto podría sobrar,
    # pero si es dinámico al arranque, lo necesitamos.
    if [ -f /root/admin/base/admin/start.sh ]; then
        # Ejecutamos partes del start original si fuera necesario, 
        # pero cuidado de no bloquear la ejecución.
        # Por seguridad, asumimos que ubbase configura SSH y Users.
        echo "Cargando configuración base..."
    fi
fi

# Iniciamos Nginx en segundo plano
echo "Iniciando Nginx..."
service nginx start

# Iniciamos SSHD en primer plano (para mantener el contenedor vivo)
# Esto replica el comportamiento de ubbase de mantener el contenedor vivo,
# pero permitiendo que nginx corra también.
echo "Iniciando SSHD (Foreground)..."
mkdir -p /run/sshd
exec /usr/sbin/sshd -D
