make_ssh(){
    # Eliminar líneas Port existentes, comentadas o no
    sed -i '/^[Pp]ort /d' /etc/ssh/sshd_config
    sed -i '/^#Port /d' /etc/ssh/sshd_config

    # Insertar nuestra línea Port al inicio del archivo
    sed -i "1i Port ${SSH_PORT}" /etc/ssh/sshd_config

    # Permitir root login (si quieres)
    sed -i 's/#PermitRootLogin .*/PermitRootLogin yes/' /etc/ssh/sshd_config

    mkdir -p /var/run/sshd
}
