#!/bin/bash

newUser(){
  useradd -rm -d /home/${USUARIO} -s /bin/bash ${USUARIO}   
  echo "${USUARIO}:1234" | chpasswd
  echo "Bienvenida ${USUARIO} a tu empresa ..." > /home/${USUARIO}/bienvenida.txt
}

main(){
    newUser
    # encargada de dejar este contenedor vivo en background 
    tail -f /dev/null
}

main