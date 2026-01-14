#!/bin/bash
# Script de inicio para contenedor MicroK8s
set -e

# Cargar scripts de funciones
source /root/admin/base/usuarios/mainUsuarios.sh
source /root/admin/base/ssh/mainSsh.sh
source /root/admin/base/ciber/mainCiber.sh
source /root/admin/base/kubernetes/maink8s.sh

main(){
    # Crear directorio de logs
    mkdir -p /root/logs
    touch /root/logs/informe.log

    echo "INFO: Iniciando configuración del contenedor MicroK8s..." >> /root/logs/informe.log
    
    # --- Gestión de usuario ---
    set +e
    newUser
    resuser=$?
    set -e

    if [ "$resuser" -eq 0 ]; then
        echo "INFO: Usuario creado correctamente. Configurando sudo..." >> /root/logs/informe.log
        configurar_sudo
    fi
    
    # Configurar SSH
    echo "INFO: Configurando SSH..." >> /root/logs/informe.log
    configurar_ssh

    # --- Instalar MicroK8s ---
    echo "INFO: Instalando MicroK8s..." >> /root/logs/informe.log
    install_microk8s

    # Auditoría de ciberseguridad
    echo "INFO: Iniciando auditoría de ciberseguridad..." >> /root/logs/informe.log
    load_entrypoint_base

    # Iniciar SSH
    echo "INFO: Configuración finalizada. Iniciando SSH..." >> /root/logs/informe.log
    mkdir -p /run/sshd

    # Mensaje final
    echo "======================================"
    echo "MicroK8s instalado y configurado"
    echo "======================================"
    echo "Para verificar: docker exec -it <container> bash"
    echo "Luego ejecuta: source /root/admin/base/kubernetes/maink8s.sh && verify_microk8s"
    echo "======================================"

    exec /usr/sbin/sshd -D
}

# Ejecutar función principal
main
