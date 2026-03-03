#!/bin/bash
# Script de inicio para PostgreSQL con configuracion SSH heredada
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

    # Iniciar PostgreSQL
    echo "INFO: Iniciando PostgreSQL..." >> /root/logs/informe.log
    mkdir -p /run/sshd
    
    # Iniciar PostgreSQL en segundo plano
    service postgresql start

    # Esperar a que PostgreSQL esté listo
    echo "INFO: Esperando a que PostgreSQL esté listo..." >> /root/logs/informe.log
    sleep 3

    # Crear usuario y base de datos (si no existen)
    echo "INFO: Configurando base de datos y usuario..." >> /root/logs/informe.log
    su - postgres -c "psql -c \"SELECT 1 FROM pg_user WHERE usename = 'admin'\" | grep -q 1 || psql -c \"CREATE USER admin WITH PASSWORD 'password';\""
    su - postgres -c "psql -lqt | cut -d \| -f 1 | grep -qw nestapi_db || psql -c \"CREATE DATABASE nestapi_db OWNER admin;\""
    
    echo "INFO: Base de datos 'nestapi_db' y usuario 'admin' configurados correctamente." >> /root/logs/informe.log

    # Mantener SSH en primer plano
    exec /usr/sbin/sshd -D
}

# Ejecutar funcion principal
main
