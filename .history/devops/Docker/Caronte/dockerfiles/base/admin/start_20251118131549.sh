#!/bin/bash
# carga las varialbes de entorno pasadas desde el D.compose.yml
set -e

source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSSH.sh

main(){
  # gestion usuario --> getUser.sh
  # gestion logs --> logrotate.sh
    touch /root/logs/informe.log
    newUser
      if [ "$?" -eq 0 ]
     then
          make_ssh
      f
    # encargada de dejar este contenedor vivo en background 
    tail -f /dev/null
}

main