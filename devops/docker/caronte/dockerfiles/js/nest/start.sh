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

    # --- 2. Gestion de usuario (FORZADO para evitar errores de PAM) ---
    echo "INFO: Creando usuario ${USUARIO:-admin-pod}..." >> /root/logs/informe.log
    useradd -m -s /bin/bash ${USUARIO:-admin-pod} || echo "User already exists"
    echo "${USUARIO:-admin-pod}:1234" | chpasswd
    
    # Intentar ejecutar scripts base por si acaso
    set +e
    newUser
    configurar_sudo
    set -e
    
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
    # Arrancamos en segundo plano para que el script siga y active el SSH
    echo "INFO: Ejecutando: node dist/main &" >> /root/logs/informe.log
    node dist/main &

    # --- 6. Mantener contenedor vivo con SSH ---
    echo "INFO: Configurando y Lanzando servidor SSH..." >> /root/logs/informe.log
    mkdir -p /run/sshd
    # Habilitar password auth para que no de Permission Denied
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
    
    # Mantener el contenedor vivo lanzando SSHD en el puerto correcto
    echo "INFO: Sistema listo. Entrando en bucle de espera..." >> /root/logs/informe.log
    exec /usr/sbin/sshd -D -p ${PORT_SSH:-2228}
}

# Ejecutar funcion principal
main
