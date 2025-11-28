#!/bin/bash
# carga las varialbes de entorno pasadas desde el D.compose.yml
set -e

source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh

main() {

    touch /root/logs/informe.log
    newUser
    resuser=$?
    if [ "$resuser" -eq 0 ]; then
        make_ssh
    fi

    tail -f /dev/null
}

main

tail -f /dev/null