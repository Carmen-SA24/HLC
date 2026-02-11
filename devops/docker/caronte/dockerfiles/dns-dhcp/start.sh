#!/bin/bash
# Script de inicio para Technitium DNS/DHCP con configuracion SSH heredada
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
    fi
    
    # Configurar SSH
    echo "INFO: Configurando SSH..." >> /root/logs/informe.log
    configurar_ssh

    # Iniciar Technitium DNS Server
    echo "INFO: Iniciando Technitium DNS/DHCP Server..." >> /root/logs/informe.log
    mkdir -p /run/sshd
    
    # Iniciar Technitium en segundo plano
    cd /opt/technitium
    dotnet DnsServerApp.dll &

    # Mantener SSH en primer plano
    exec /usr/sbin/sshd -D
}

# Ejecutar funcion principal
main
