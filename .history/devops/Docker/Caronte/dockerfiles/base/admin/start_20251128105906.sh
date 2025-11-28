#!/bin/bash
# Esta directiva hace que el script se detenga inmediatamente si cualquier comando falla.
set -e

# --- 1. Cargar scripts de funciones ---
source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh

main(){
    # Creación segura del directorio de logs
    mkdir -p /root/logs
    touch /root/logs/informe.log

    echo "INFO: Iniciando configuración de usuario..." >> /root/logs/informe.log
    
    # --- 2. Gestión de usuario ---
    newUser
    resuser=$?

    # --- 3. Configuración condicional (solo si el usuario se creó correctamente) ---
    if [ "$resuser" -eq 0 ]; then
        echo "INFO: Usuario creado correctamente. Configurando sudo..." >> /root/logs/informe.log
        configurar_sudo
    fi
    
    if [ "$resuser" -eq 0 ]; then
        echo "INFO: Configurando SSH..." >> /root/logs/informe.log
        configurar_ssh
    fi

    # Si tu objetivo era un servidor SSH, usa este comando en su lugar:
    # /usr/sbin/sshd -D

    # --- 4. Comando para mantener el contenedor en ejecución ---
    # Este comando es el proceso principal y evita que el contenedor se detenga.
    echo "INFO: Configuración finalizada. Contenedor en modo de espera." >> /root/logs/informe.log
    tail -f /dev/null   
}

# Ejecutar la función principal
main