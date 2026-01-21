
#!/bin/bash
set -e

config_ssh(){
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
    sed -i 's/#Port 22/Port 22/' /etc/ssh/sshd_config
    if [ ! -d /home/${USUARIO}/.ssh ]
    then
        mkdir /home/${USUARIO}/.ssh
        cat /root/admin/base/common/id_ed25519.pub >> /home/${USUARIO}/.ssh/authorized_keys
    fi
    # /etc/init.d/ssh start &
    exec /usr/sbin/sshd -D & # dejar el ssh en background (2plano)
}

config_sudoers(){
    if [ -f /etc/sudoers ]
    then 
        #comprobar que el ${USUARIO} No existe
        echo "${USUARIO} ALL=(ALL:ALL) ALL" >> /etc/sudoers
    fi
}

newSSH(){
    #gestion de errores y salida a logs
    
    config_sudoers
    config_ssh
}