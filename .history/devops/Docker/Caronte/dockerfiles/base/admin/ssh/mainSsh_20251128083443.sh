çmake_ssh() {
    sed -i 's/Port.* /Port '$PORT_SSH'' /etc/ssh/sshd_config
    sed -i 's/PermitRootLogin.* /PermitRootLogin no/' /etc/ssh/sshd_config

    service ssh restart

    mkdir -p /home/${USUARIO}/.ssh

    echo "
}
