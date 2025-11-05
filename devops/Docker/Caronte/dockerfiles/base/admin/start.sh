#!/bin/bash

newUser(){
  useradd -rm -d /home/rosa -s /bin/bash rosa   
  echo "rosa:1234" | chpasswd
  echo "Bienvenida Rosa ..." > /home/rosa/bienvenida.txt
}

main(){
    newUser
    # encargada de dejar este contenedor vivo en background 
    tail -f /dev/null
}

main