make_ssh() {
    # Eliminar líneas Port existentes
    sed -i '/^[Pp]ort /d' /etc/ssh/sshd_config
    sed -i '/^#Port /d' /etc/ssh/sshd_config

    # Insertar nuestra línea Port al inicio del archivo usando la variable de entorno
    sed -i "1i Port ${PORT_SSH:-22}" /etc/ssh/sshd_config

    # Permitir root login
    sed -i 's/#PermitRootLogin .*/PermitRootLogin yes/' /etc/ssh/sshd_config

    mkdir -p /var/run/sshd
    
    # Configurar sudo sin contraseña si el usuario existe
    if id -u "${USUARIO:-maria}" >/dev/null 2>&1; then
        echo "${USUARIO:-maria} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/${USUARIO:-maria}
        chmod 0440 /etc/sudoers.d/${USUARIO:-maria}
    fi
    
    # Iniciar el servicio SSH
    /usr/sbin/sshd

    # /etc/init.d/ssh start &
    # exec /usr/sbin/sshd -D & # dejar el ssh en background  (2do plano)
}
