#!/bin/bash
# carga las varialbes de entorno pasadas desde el D.compose.yml
set -e

source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh

# main(){
#   # gestion usuario --> getUser.sh
#   # gestion logs --> logrotate.sh
#     touch /root/logs/informe.log
    
#     # resuser=newUser
#     #   res=if [ "resuser" -eq 0 ]
#     #  then
#     #       make_ssh
#     #   fi

#     #     if [ "res" -eq 0 ]
#     #  then
#     #       make_ssh
#     #   fi
#     # encargada de dejar este contenedor vivo en background 
#     tail -f /dev/null
# }

main(){
    touch /root/logs/informe.log
    
    # Configurar SSH
    make_ssh

    # Generar claves host si no existen
    if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
        ssh-keygen -A
    fi

    # Iniciar SSH en primer plano (Docker necesita un PID principal activo)
    /usr/sbin/sshd -D
}

main