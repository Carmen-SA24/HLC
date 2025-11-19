make_ssh() {

    # Crear carpeta necesaria para SSH
    mkdir -p /var/run/sshd

    # Asegurar que exista una directiva Port
    if grep -q "^Port " /etc/ssh/sshd_config; then
        # Si existe Port, lo sustituimos
        sed -i "s/^Port .*/Port ${SSH_PORT}/" /etc/ssh/sshd_config
    else
        # Si no existe, la añadimos
        echo "Port ${SSH_PORT}" >> /etc/ssh/sshd_config
    fi

    # Permitir root (solo si lo necesitas)
    sed -i 's/.*PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config

    # Asegurar autenticación por contraseña
    sed -i 's/.*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config

    # Iniciar servicio SSH
    /usr/sbin/sshd
}
