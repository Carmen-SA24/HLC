#!/bin/bash
# carga las varialbes de entorno pasadas desde el D.compose.yml
set -e

source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh

main() {

    touch /root/logs/informe.log
    nuevo_usuario
    resuser=$?
    if [ "$resuser" -eq 0 ]; then
        configurar_ssh
    fi

}

main
