#!/bin/bash
# carga las variables de entono pasadas desde el D.Compose
set -e

source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh

# source /root/admin/base/usuarios/makeUsuariosPostgress

main() {
    # gestion usuario ---> getsUser.sh
    # gestion del sudo ---> gestSudo.sh
    # gestion del ssh ---> gestSsh.sh
    # ...
    touch /root/logs/informe.log
    newUser
    if [ "$?" -eq 0 ]
    then
        newSSH
    fi

    # encargada de dejar este contendor vivo en BGround. 
    # Eliminamos el tail 
    ## tail -f /dev/null
    ## script's que se encargar de configurar el imagen/contenedor
}

main