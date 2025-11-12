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
     if [ $? -eq 0 ]
     then
          useradd -rm -d /home/${USUARIO} -s /bin/bash ${USUARIO}   
          echo "${USUARIO}:${PASSWORD}" | chpasswd
          echo "Bienvenida ${USUARIO} a tu empresa ..." > /home/${USUARIO}/bienvenida.txt
          echo "Usuario ${USUARIO} creado correctamente" >> /root/logs/informe.log
      else
          echo "Usuario ${USUARIO} no reado, existe home" >> /root/logs/informe.log
    fi
    else
      echo "Usuario ${USUARIO} no creado, existe en passwd" >> /root/logs/informe.log 
  fi
}

newUser