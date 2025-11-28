çmake_ssh() {
    sed -i 's/Port.* /Port '$PORT_SSH'' /etc/ssh/sshd_config
    sed -i 's/PermitRootLogin.* /PermitRootLogin yes/' /etc/ssh/sshd_config
}
