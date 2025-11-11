#!/bin/bash
# carga las varialbes de entorno pasadas desde el docker-compose.yml
set -e

check_usuario(){
  if greo -q "${USUARIO}" /etc/passwd 
   then
       echo "${USUARIO} se encuentra en el sistema" >> /root/logs/informe.log
       return 1
    else 
      echo "${USUARIO} no existe en el sistema" >> /root/logs/informe.log
      return 0
    fi
}
newUser(){
  check_usuario
  if [ $? -eq 0 ]
   then
  useradd -rm -d /home/${USUARIO} -s /bin/bash ${USUARIO}   
  echo "${USUARIO}:${PASSWORD}" | chpasswd
  echo "Bienvenida ${USUARIO} a tu empresa ..." > /home/${USUARIO}/bienvenida.txt
}

main(){
    touch /root/logs/informe.log
    newUser
    # encargada de dejar este contenedor vivo en background 
    tail -f /dev/null
}

main