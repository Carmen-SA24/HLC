#!/bin/bash
# Script principal de ciberseguridad
# Carga y ejecuta funciones de auditoria

# Cargar funcion de auditoria de puertos
source /root/admin/base/ciber/jambload_ciber.sh

# Iniciar escaneo de puertos en background
load_entrypoint_base(){
    echo "INFO: Iniciando auditoria de ciberseguridad..." >> /root/logs/informe.log
    jambscan &
}

# Exportar funciones para uso en otros scripts
export -f jambload_ciber
export -f jambscan
export -f load_entrypoint_base
