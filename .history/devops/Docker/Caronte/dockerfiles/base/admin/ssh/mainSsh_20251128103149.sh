configurar_ssh() {
    sed -i 's/#Port.*/Port '$PORT_SSH'/' /etc/ssh/sshd_config
    sed -i 's/#PermitRootLogin.*/PermitRootLogin '$ROOT_LOGIN'/' /etc/ssh/sshd_config

    service ssh restart
    mkdir -p /run/sshd
    mkdir -p /home/${USUARIO}/.ssh

    cat /root/admin/base/id_ed25519.pub >> /home/${USUARIO}/.ssh/authorized_keys

    exec /usr/sbin/sshd -D
}
#!/bin/bash

configurar_ssh() {

  # Deshabilitar el login de root
  sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
  # Cambiar el puerto de SSH
  sed -i 's/#Port.*/Port '$PORT_SSH'/' /etc/ssh/sshd_config

  #service ssh restart # ESTO DARÁ PROBLEMAS A FUTURO POR LO QUE USAREMOS EL QUE HAY COMENTADO ABAJO
  mkdir -p /run/sshd
  mkdir /home/${USUARIO}/.ssh
  cat /root/admin/base/common/id_rsa.pub >> /home/${USUARIO}/.ssh/authorized_keys
    #/etc/init.d/ssh start
  # Reinicar el servicio SSH para que se aplique las configuraciones

  #exec /usr/sbin/sshd -D & # dejar el ssh en background PARA CUANDO LO IMPLEMENTOS EN UN SERVICIO
  exec /usr/sbin/sshd -D &
}