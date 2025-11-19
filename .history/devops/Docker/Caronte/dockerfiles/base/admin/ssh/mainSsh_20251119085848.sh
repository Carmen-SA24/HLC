#!/bin/bash
set -e

SSH_PORT=${PORT_SSH:-22} 

make_ssh() {

    # Crear carpeta requerida por sshd
    mkdir -p /var/run/sshd

    # Ajustar configuración del puerto SSH
    if ! grep -q "Port ${SSH_PORT}" /etc/ssh/sshd_config; then
        sed -i "s/^#Port 22/Port ${SSH_PORT}/" /etc/ssh/sshd_config
        sed -i "s/^Port 22/Port ${SSH_PORT}/" /etc/ssh/sshd_config
    fi

    # Permitir login root
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

    # Asegurar PasswordAuthentication ON
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

    # Iniciar servicio SSH (sin systemd)
    /usr/sbin/sshd

}
