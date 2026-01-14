#!/bin/bash
# Script de inicio alternativo - Solo para contenedores sin estructura base

# Si existe el script mejorado, usarlo
if [ -f /root/admin/base/start.sh ]; then
    exec /root/admin/base/start.sh
else
    # Inicio básico
    echo "Iniciando servicios básicos..."
    
    # Crear logs
    mkdir -p /root/logs
    
    # Iniciar systemd (necesario para snap)
    exec /lib/systemd/systemd
fi
