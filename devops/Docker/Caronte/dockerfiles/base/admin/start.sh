#!/bin/bash
# Esta directiva hace que el script se detenga si cualquier comando falla.
set -e

# --- 1. Cargar scripts de funciones ---
source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh

main(){
    # Creación segura del directorio de logs
    mkdir -p /root/logs
    touch /root/logs/informe.log

    echo "INFO: Iniciando configuración de usuario..." >> /root/logs/informe.log
    
    # --- 2. Gestión de usuario (CORREGIDO) ---
    # Desactivamos el modo estricto un momento para que no se cierre si el usuario ya existe
    set +e
    newUser
    resuser=$?
    set -e 
    # Volvemos a activar el modo estricto

    # --- 3. Configuración condicional ---
    if [ "$resuser" -eq 0 ]; then
        echo "INFO: Usuario creado correctamente. Configurando sudo..." >> /root/logs/informe.log
        configurar_sudo
    fi
    
    # OJO: He sacado configurar_ssh fuera del IF para que se ejecute siempre
    # (por si cambiaste el puerto en el .env y quieres que se aplique aunque el usuario ya exista)
    echo "INFO: Configurando SSH..." >> /root/logs/informe.log
    configurar_ssh

    # --- 4. Comando final (CORREGIDO) ---
    echo "INFO: Configuración finalizada. Contenedor en modo de espera." >> /root/logs/informe.log
    
    # ESTA LÍNEA ES LA QUE TE FALTABA PARA QUE NO FALLE:
    mkdir -p /run/sshd

    exec /usr/sbin/sshd -D
}

# Ejecutar la función principal
main