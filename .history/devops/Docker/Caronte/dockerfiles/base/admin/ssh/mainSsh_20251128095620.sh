set -e
make_ssh() {
    sed -i 's/#Port*/Port '$PORT_SSH'/' /etc/ssh/sshd_config
    sed -i 's/#PermitRootLogin.*/PermitRootLogin '$ROOT_LOGIN'/' /etc/ssh/sshd_config

    service ssh restart

    mkdir -p /home/${USUARIO}/.ssh

    cat /root/admin/base/id_ed25519.pub >> /home/${USUARIO}/.ssh/authorized_keys
}
