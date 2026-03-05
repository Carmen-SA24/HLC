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
    
    # Configurar PostgreSQL para escuchar en todas las interfaces
    echo "INFO: Configurando PostgreSQL para aceptar conexiones externas..." >> /root/logs/informe.log
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/*/main/postgresql.conf
    sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/*/main/postgresql.conf
    
    # Permitir conexiones desde cualquier IP
    echo "host    all             all             0.0.0.0/0               md5" >> /etc/postgresql/*/main/pg_hba.conf
    
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


    # --- INICIO BLOQUE REPLICACIÓN STREAMING ---
    # Detectar si es pod-0 (PRIMARY) o pod-1 (REPLICA)
    ORDINAL=$(hostname | awk -F'-' '{print $NF}')
    PGDATA="/var/lib/postgresql/data"

    if [ "$ORDINAL" = "0" ]; then
        echo "Configurando como PRIMARY..."
        # Configuración de postgresql.conf para replicación
        sed -i '/^#*wal_level/c\wal_level = replica' /etc/postgresql/*/main/postgresql.conf
        sed -i '/^#*max_wal_senders/c\max_wal_senders = 5' /etc/postgresql/*/main/postgresql.conf
        sed -i '/^#*wal_keep_size/c\wal_keep_size = 128' /etc/postgresql/*/main/postgresql.conf
        sed -i '/^#*hot_standby/c\hot_standby = on' /etc/postgresql/*/main/postgresql.conf
        echo "host replication all all md5" >> /etc/postgresql/*/main/pg_hba.conf
    else
        echo "Configurando como REPLICA..."
        PRIMARY_HOST="statefull-nestapi-postgres-0.nestapi-postgres.nest.svc.cluster.local"
        # Esperar a que el primary esté disponible
        for i in {1..30}; do
            pg_isready -h $PRIMARY_HOST -p 5432 -U admin && break
            sleep 5
        done
        # Limpiar directorio de datos
        rm -rf $PGDATA/*
        # Copiar datos desde Primary usando pg_basebackup
        PGPASSWORD=password pg_basebackup -h $PRIMARY_HOST -D $PGDATA -U admin -v -P -X stream -R
    fi
    # --- FIN BLOQUE REPLICACIÓN STREAMING ---

    # Ejecutar PostgreSQL en primer plano para que el pod se mantenga vivo
    exec su - postgres -c "postgres -D /var/lib/postgresql/data"
}

# Ejecutar funcion principal
main
