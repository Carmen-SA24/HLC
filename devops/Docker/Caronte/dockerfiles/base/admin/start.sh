#!/bin/bash
# carga las varialbes de entorno pasadas desde el docker-compose.yml
set -e

source /root/admin/base/usuarios/mainUsuarios.sh

main(){
  # gestion usuario --> getUser.sh
  # gestion logs --> logrotate.sh
    touch /root/logs/informe.log
   newUser
    # encargada de dejar este contenedor vivo en background 
    tail -f /dev/null
}

main