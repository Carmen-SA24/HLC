#!/bin/bash
# Script de inicio para Cockpit

# Configurar panel
if [ -f /root/admin/panel/config.sh ]; then
    source /root/admin/panel/config.sh
fi

# Iniciar Cockpit sin TLS
echo "Iniciando Cockpit en puerto 9090..."
/usr/libexec/cockpit-ws --no-tls &

# Iniciar SSH
echo "Iniciando SSH..."
mkdir -p /run/sshd
exec /usr/sbin/sshd -D
