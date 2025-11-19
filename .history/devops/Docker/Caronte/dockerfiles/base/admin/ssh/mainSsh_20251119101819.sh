make_ssh() {
    # Eliminar líneas Port existentes
    sed -i '/^[Pp]ort /d' /etc/ssh/sshd_config
    sed -i '/^#Port /d' /etc/ssh/sshd_config

    # Insertar nuestra línea Port al inicio del archivo usando la variable de entorno
    sed -i "1i Port ${PORT_SSH:-22}" /etc/ssh/sshd_config

    # Permitir root login
    sed -i 's/#PermitRootLogin .*/PermitRootLogin yes/' /etc/ssh/sshd_config

    mkdir -p /var/run/sshd
    
    # Iniciar el servicio SSH
    /usr/sbin/sshd

    
    exec /usr/sbin/sshd -D # dejar el ssh en background  (2do plano)
}
