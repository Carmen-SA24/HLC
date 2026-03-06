#!/bin/bash
# Inicialización de NestJS con seguridad heredada

# --- 1. Cargar scripts base ---
source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh
source /root/admin/base/ciber/mainCiber.sh

main(){
    mkdir -p /root/logs
    echo "INFO: Iniciando configuracion..." >> /root/logs/informe.log

    # --- 2. Gestion de usuario ---
    echo "INFO: Creando usuario ${USUARIO:-admin-pod}..." >> /root/logs/informe.log
    useradd -m -s /bin/bash ${USUARIO:-admin-pod} || echo "User exists"
    # Establecer contraseña
    echo "${USUARIO:-admin-pod}:1234" | chpasswd --allow-root || usermod -p $(echo 1234 | openssl passwd -1 -stdin) ${USUARIO:-admin-pod}
    
    # Ejecutar scripts base (si fallan, seguimos adelante)
    newUser || echo "Skipping newUser"
    configurar_sudo || echo "Skipping sudo"
    configurar_ssh || echo "Skipping config_ssh"

    # --- 5. Arrancar NestJS ---
    cd /app
    echo "INFO: Ejecutando NestJS en segundo plano..." >> /root/logs/informe.log
    node dist/main &

    # --- 6. LANZAR SSH Y MANTENER VIVO ---
    echo "INFO: Configurando SSHD..." >> /root/logs/informe.log
    mkdir -p /run/sshd
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
    
    echo "INFO: Lanzando SSHD final en puerto ${PORT_SSH:-2228}..." >> /root/logs/informe.log
    # Iniciar demonio principal SSH
    exec /usr/sbin/sshd -D -p ${PORT_SSH:-2228}
}

main
