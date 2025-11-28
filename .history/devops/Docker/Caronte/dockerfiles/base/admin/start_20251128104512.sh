#!/bin/bash
# carga las varialbes de entorno pasadas desde el D.compose.yml
set -e

source /root/admin/base/usuarios/mainusuarios.sh
source /root/admin/base/ssh/mainssh.sh

main(){
    # Gestión de usuario --> getuser.sh
    # Gestión del sudo --> getsudo.sh
    # ...
    touch /root/logs/informe.log
    newUser
    resuser=$?
    if [ "$resuser" -eq 0 ]; then
        configurar_sudo
    fi
    if [ "$resuser" -eq 0 ]; then
        configurar_ssh
    fi

    # Encargada de mantener el contenedor en ejecución de Background
    #tail -f /dev/null   
}

main