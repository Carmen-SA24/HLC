#!/bin/bash
# carga las varialbes de entorno pasadas desde el docker-compose.yml
# set -e

check_usuario(){
  if grep -q "${USUARIO}" /etc/passwd 
   then
       echo "${USUARIO} se encuentra en el sistema" >> /root/logs/informe.log
       return 1
    else 
      echo "${USUARIO} no existe en el sistema" >> /root/logs/informe.log
      return 0
    fi
}

check_home(){
  if [ ! -d "/home/${USUARIO}" ]
   then
       echo "/home/${USUARIO} no existe" >> /root/logs/informe.log
       return 0 # true
   else 
      echo "/home/${USUARIO} existe" >> /root/logs/informe.log
      return 1 # falso
  fi
}

newUser(){
  check_usuario
   # 'cat etc/passwd | grep "${USUARIO}"'
  if [ $? -eq 0 ]
  then
     check_home
     if [ "$?" -eq 0 ]
     then
          useradd -rm -d /home/${USUARIO} -s /bin/bash ${USUARIO}   
          echo "${USUARIO}:${PASSWORD}" | chpasswd
          echo "Bienvenida ${USUARIO} a tu empresa ..." > /home/${USUARIO}/bienvenida.txt
          
          # Configurar clave SSH para el usuario y root
          if [ -f /tmp/authorized_key.pub ]; then
              # Copiar clave a carpeta common del usuario (visible)
              mkdir -p /home/${USUARIO}/common
              cp /tmp/authorized_key.pub /home/${USUARIO}/common/id_ed25519.pub
              chown -R ${USUARIO}:${USUARIO} /home/${USUARIO}/common
              
              # Configurar SSH para el usuario
              mkdir -p /home/${USUARIO}/.ssh
              cat /tmp/authorized_key.pub >> /home/${USUARIO}/.ssh/authorized_keys
              chmod 700 /home/${USUARIO}/.ssh
              chmod 600 /home/${USUARIO}/.ssh/authorized_keys
              chown -R ${USUARIO}:${USUARIO} /home/${USUARIO}/.ssh
              
              # Copiar clave a carpeta common de root (visible)
              mkdir -p /root/common
              cp /tmp/authorized_key.pub /root/common/id_ed25519.pub
              
              # Configurar SSH para root
              mkdir -p /root/.ssh
              cat /tmp/authorized_key.pub >> /root/.ssh/authorized_keys
              chmod 700 /root/.ssh
              chmod 600 /root/.ssh/authorized_keys
              
              echo "--> Clave SSH configurada para ${USUARIO} y root en .ssh y common" >> /root/logs/informe.log
          fi
          
          echo "Usuario ${USUARIO} creado correctamente" >> /root/logs/informe.log
          return 0
      else
          echo "Usuario ${USUARIO} no reado, existe home" >> /root/logs/informe.log
          return 1
    fi
    else
      echo "Usuario ${USUARIO} no creado, existe en passwd" >> /root/logs/informe.log 
      return 1
  fi
}
