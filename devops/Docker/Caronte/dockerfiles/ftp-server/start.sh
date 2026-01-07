#!/bin/bash
# Script de inicio para servidor FTP con configuracion SSH heredada
set -e

# Cargar funciones de configuracion base
source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh

main(){
    # Crear directorio de logs
    mkdir -p /root/logs
    touch /root/logs/informe.log

    echo "INFO: Iniciando configuracion de usuario..." >> /root/logs/informe.log
    
    # Gestion de usuario
    set +e
    newUser
    resuser=$?
    set -e

    # Configurar sudo si el usuario fue creado
    if [ "$resuser" -eq 0 ]; then
        echo "INFO: Usuario creado. Configurando sudo..." >> /root/logs/informe.log
        configurar_sudo
        
        # Agregar usuario a lista de FTP permitidos
        echo "$USUARIO" >> /etc/vsftpd.userlist
    fi
    
    # Configurar SSH
    echo "INFO: Configurando SSH..." >> /root/logs/informe.log
    configurar_ssh

    # Iniciar vsftpd
    echo "INFO: Iniciando servidor FTP..." >> /root/logs/informe.log
    mkdir -p /run/sshd
    mkdir -p /var/run/vsftpd/empty
    
    # Iniciar vsftpd en segundo plano
    service vsftpd start

    # Mantener SSH en primer plano
    exec /usr/sbin/sshd -D
}

# Ejecutar funcion principal
main
