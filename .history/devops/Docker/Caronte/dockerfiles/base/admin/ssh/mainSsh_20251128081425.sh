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
    USER_HOME="/home/${USUARIO}"
    PUB_KEY_SOURCE="${CONTEXTO}/common/id_ed25519.pub"

    mkdir -p "$USER_HOME/.ssh"
    chmod 700 "$USER_HOME/.ssh"

    # Evitar duplicados en authorized_keys
    touch "$USER_HOME/.ssh/authorized_keys"
        echo "$(cat "$PUB_KEY_SOURCE")" >> "$USER_HOME/.ssh/authorized_keys"

    # --- INICIAR SSH ---
    /usr/sbin/sshd
}
