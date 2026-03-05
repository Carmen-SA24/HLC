#!/bin/bash
# Script de inicio para PostgreSQL con replicacion streaming y seguridad heredada
# Pod-0 = PRIMARY (lectura/escritura)
# Pod-1+ = REPLICA (sincronizada desde primary via WAL)

set -e

# Cargar funciones de configuracion base
source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh

# -------------------------------------------------------
# Variables globales
# -------------------------------------------------------
PGCONF_DIR=$(ls -d /etc/postgresql/*/main 2>/dev/null | head -n1)
PGDATA_SVC="$PGCONF_DIR"          # Donde postgresql.conf / pg_hba.conf
PGDATA_DIR="/var/lib/postgresql/$(ls /etc/postgresql/ 2>/dev/null | head -n1)/main"
LOG=/root/logs/informe.log

# Detectar ordinal del pod (0 = primary, 1+ = replica)
ORDINAL=$(hostname | awk -F'-' '{print $NF}')
PRIMARY_SVC="statefull-nestapi-postgres-0.nestapi-postgres.nest.svc.cluster.local"

main(){
    # -------------------------------------------------------
    # 1. Logs y usuario del sistema
    # -------------------------------------------------------
    mkdir -p /root/logs
    touch $LOG
    mkdir -p /run/sshd

    echo "INFO: === Iniciando pod PostgreSQL (ordinal=$ORDINAL) ===" >> $LOG

    # Gestion de usuario del sistema
    set +e
    newUser
    resuser=$?
    set -e
    if [ "$resuser" -eq 0 ]; then
        echo "INFO: Usuario creado. Configurando sudo..." >> $LOG
        configurar_sudo
    fi

    # Configurar SSH (herencia ubsecurity)
    echo "INFO: Configurando SSH..." >> $LOG
    configurar_ssh

    # Iniciar SSH en background (mantiene acceso al pod)
    /usr/sbin/sshd &
    echo "INFO: SSH iniciado en background." >> $LOG

    # -------------------------------------------------------
    # 2. Configurar postgresql.conf base (escuchar en todas las IPs)
    # -------------------------------------------------------
    echo "INFO: Configurando postgresql.conf..." >> $LOG
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" $PGCONF_DIR/postgresql.conf
    sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/g" $PGCONF_DIR/postgresql.conf

    # Asegurar acceso desde cualquier IP
    grep -q "0.0.0.0/0" $PGCONF_DIR/pg_hba.conf || \
        echo "host    all             all             0.0.0.0/0               md5" >> $PGCONF_DIR/pg_hba.conf

    # -------------------------------------------------------
    # 3. Configuracion segun rol (PRIMARY o REPLICA)
    # -------------------------------------------------------
    if [ "$ORDINAL" = "0" ]; then
        echo "INFO: === Configurando como PRIMARY ===" >> $LOG
        setup_primary
    else
        echo "INFO: === Configurando como REPLICA ===" >> $LOG
        setup_replica
    fi
}

# -------------------------------------------------------
# Funcion PRIMARY
# -------------------------------------------------------
setup_primary(){
    # Activar parametros de replicacion en postgresql.conf
    grep -q "^wal_level" $PGCONF_DIR/postgresql.conf && \
        sed -i 's/^wal_level.*/wal_level = replica/' $PGCONF_DIR/postgresql.conf || \
        echo "wal_level = replica" >> $PGCONF_DIR/postgresql.conf

    grep -q "^max_wal_senders" $PGCONF_DIR/postgresql.conf && \
        sed -i 's/^max_wal_senders.*/max_wal_senders = 5/' $PGCONF_DIR/postgresql.conf || \
        echo "max_wal_senders = 5" >> $PGCONF_DIR/postgresql.conf

    grep -q "^wal_keep_size" $PGCONF_DIR/postgresql.conf && \
        sed -i 's/^wal_keep_size.*/wal_keep_size = 128/' $PGCONF_DIR/postgresql.conf || \
        echo "wal_keep_size = 128" >> $PGCONF_DIR/postgresql.conf

    grep -q "^hot_standby" $PGCONF_DIR/postgresql.conf && \
        sed -i 's/^hot_standby.*/hot_standby = on/' $PGCONF_DIR/postgresql.conf || \
        echo "hot_standby = on" >> $PGCONF_DIR/postgresql.conf

    # Permitir replicacion desde cualquier IP
    grep -q "replication" $PGCONF_DIR/pg_hba.conf || \
        echo "host    replication     all             0.0.0.0/0               md5" >> $PGCONF_DIR/pg_hba.conf

    # Iniciar PostgreSQL
    echo "INFO: [PRIMARY] Arrancando PostgreSQL..." >> $LOG
    service postgresql start
    sleep 3

    # Crear usuario y base de datos
    echo "INFO: [PRIMARY] Creando usuario admin y base de datos..." >> $LOG
    su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='admin'\" | grep -q 1 || \
        psql -c \"CREATE USER admin WITH PASSWORD 'password' REPLICATION;\""
    su - postgres -c "psql -lqt | cut -d\| -f1 | grep -qw nestapi_db || \
        psql -c \"CREATE DATABASE nestapi_db OWNER admin;\""

    # Asegurar que el usuario admin tiene permisos de REPLICATION
    su - postgres -c "psql -c \"ALTER USER admin WITH REPLICATION;\""

    echo "INFO: [PRIMARY] PostgreSQL listo. Base de datos y usuario configurados." >> $LOG
    echo "INFO: [PRIMARY] Replicacion WAL habilitada." >> $LOG

    # Mantener el pod vivo (SSH ya corre en background, PostgreSQL como servicio)
    echo "INFO: [PRIMARY] Esperando indefinidamente (SSH activo)..." >> $LOG
    tail -f /var/log/postgresql/*.log 2>/dev/null || tail -f /dev/null
}

# -------------------------------------------------------
# Funcion REPLICA
# -------------------------------------------------------
setup_replica(){
    echo "INFO: [REPLICA] Esperando a que el PRIMARY este disponible..." >> $LOG

    # Esperar hasta 5 minutos a que el primary arranque
    for i in $(seq 1 60); do
        pg_isready -h $PRIMARY_SVC -p 5432 -U admin 2>/dev/null && break
        echo "INFO: [REPLICA] Intento $i/60 - Primary no disponible aun. Esperando 5s..." >> $LOG
        sleep 5
    done

    if ! pg_isready -h $PRIMARY_SVC -p 5432 -U admin 2>/dev/null; then
        echo "ERROR: [REPLICA] Primary no disponible despues de 5 minutos. Abortando." >> $LOG
        tail -f /dev/null
        exit 1
    fi

    echo "INFO: [REPLICA] Primary disponible. Iniciando pg_basebackup..." >> $LOG

    # Detener PostgreSQL si estaba corriendo
    service postgresql stop 2>/dev/null || true

    # Limpiar directorio de datos para recibir la copia del primary
    rm -rf $PGDATA_DIR/*

    # Copiar datos del primary (incluye postgresql.conf, pg_hba.conf, WAL)
    # -R genera automaticamente standby.signal y primary_conninfo
    PGPASSWORD=password pg_basebackup \
        -h $PRIMARY_SVC \
        -D $PGDATA_DIR \
        -U admin \
        -v -P \
        -X stream \
        -R

    echo "INFO: [REPLICA] pg_basebackup completado." >> $LOG

    # Asegurar que standby.signal existe (marca este postgres como replica)
    touch $PGDATA_DIR/standby.signal

    # Iniciar PostgreSQL como replica (standby)
    echo "INFO: [REPLICA] Arrancando PostgreSQL en modo standby..." >> $LOG
    service postgresql start

    echo "INFO: [REPLICA] PostgreSQL standby activo. Sincronizado con PRIMARY." >> $LOG

    # Mantener el pod vivo
    tail -f /var/log/postgresql/*.log 2>/dev/null || tail -f /dev/null
}

# Ejecutar funcion principal
main
