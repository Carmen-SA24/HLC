make_ssh() {
    # Eliminar líneas Port existentes
    sed -i '/^[Pp]ort /d' /etc/ssh/sshd_config
    sed -i '/^#Port /d' /etc/ssh/sshd_config

    # Insertar nuestra línea Port al inicio del archivo usando la variable de entorno
    sed -i "1i Port ${PORT_SSH:-22}" /etc/ssh/sshd_config

    # Permitir root login
    sed -i 's/#PermitRootLogin .*/PermitRootLogin yes/' /etc/ssh/sshd_config

    mkdir -p /var/run/sshd
    
    # Configurar sudo sin contraseña para todos los usuarios
    echo "%sudo ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/nosudo
    chmod 0440 /etc/sudoers.d/nosudo
    
    # Iniciar el servicio SSH
    /usr/sbin/sshd

    # /etc/init.d/ssh start &
    # exec /usr/sbin/sshd -D & # dejar el ssh en background  (2do plano)
     # Configurar SSH para el usuario nuevo con tu clave pública
    # USER_HOME="/home/${USUARIO}"
    # PUB_KEY_SOURCE="$CONTEXTO/common/mi_clave.pub"

    # mkdir -p "$USER_HOME/.ssh"
    # chmod 700 "$USER_HOME/.ssh"

    # cat "$PUB_KEY_SOURCE" >> "$USER_HOME/.ssh/authorized_keys"
    # chmod 600 "$USER_HOME/.ssh/authorized_keys"

    # chown -R "${USUARIO}:${USUARIO}" "$USER_HOME/.ssh"
    mkdir -p /home/${USUARIO/.ssh
}
