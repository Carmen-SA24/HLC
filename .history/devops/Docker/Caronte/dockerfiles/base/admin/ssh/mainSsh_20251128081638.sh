make_ssh() {

    # --- CONFIG SSHD ---
    # Eliminar líneas Port existentes
    sed -i '/^[Pp]ort /d' /etc/ssh/sshd_config
    sed -i '/^#Port /d' /etc/ssh/sshd_config

    # Insertar nueva línea Port al inicio
    sed -i "1i Port ${PORT_SSH:-22}" /etc/ssh/sshd_config

    # Permitir login root
    sed -i 's/#PermitRootLogin .*/PermitRootLogin yes/' /etc/ssh/sshd_config

    mkdir -p /var/run/sshd

    # --- SUDO SIN CONTRASEÑA ---
    echo "%sudo ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/nosudo
    chmod 0440 /etc/sudoers.d/nosudo

    # --- CREAR USUARIO ---
    if ! id "$USUARIO" >/dev/null 2>&1; then
        useradd -m -s /bin/bash "$USUARIO"
        usermod -aG sudo "$USUARIO"
    fi

    # --- SSH KEY PARA EL USUARIO ---

    mkdir -p /home/$USUARIO/.ssh
    echo "/root/admin/base/id_ed25519.pub" >>



    # --- INICIAR SSH ---
    /usr/sbin/sshd
}
