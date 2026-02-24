#!/bin/bash
# Entrypoint para NestJS con ciberseguridad heredada
set -e

# --- 1. Cargar scripts base (usuarios, SSH, ciber) ---
source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh
source /root/admin/base/ciber/mainCiber.sh

main(){
    # Crear directorio de logs
    mkdir -p /root/logs
    touch /root/logs/informe.log

    echo "INFO: Iniciando configuracion de NestJS..." >> /root/logs/informe.log

    # --- 2. Gestion de usuario ---
    set +e
    newUser
    resuser=$?
    set -e

    if [ "$resuser" -eq 0 ]; then
        echo "INFO: Usuario creado. Configurando sudo..." >> /root/logs/informe.log
        configurar_sudo
    fi

    # --- 3. Configurar SSH ---
    echo "INFO: Configurando SSH..." >> /root/logs/informe.log
    configurar_ssh

    # --- 4. Auditoria de ciberseguridad ---
    echo "INFO: Iniciando auditoria de ciberseguridad..." >> /root/logs/informe.log
    load_entrypoint_base

    # --- 5. Instalar dependencias y arrancar NestJS ---
    echo "INFO: Configurando NestJS..." >> /root/logs/informe.log
    cd /app

    if [ ! -d "node_modules" ]; then
        echo "INFO: Instalando dependencias..." >> /root/logs/informe.log
        npm install
    fi

    if [ ! -d "dist" ]; then
        echo "INFO: Compilando NestJS..." >> /root/logs/informe.log
        npm run build
    fi

    echo "INFO: Iniciando NestJS en puerto ${PORT:-3001}..." >> /root/logs/informe.log
    # Arrancamos en primer plano para que los logs se vean en Kubernetes
    echo "INFO: Ejecutando: node dist/main" >> /root/logs/informe.log
    node dist/main

    # --- 6. Mantener contenedor vivo con SSH ---
    mkdir -p /run/sshd
    exec /usr/sbin/sshd -D
}

# Ejecutar funcion principal
main
