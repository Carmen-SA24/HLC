#!/bin/bash
# Funcion de auditoria de puertos para ciberseguridad
# Escanea puertos abiertos y registra en log cada 30 segundos

jambload_ciber(){
    LOG_DIR="/root/logs"
    LOG_FILE="$LOG_DIR/\${CONTENEDOR}_ports"
    
    # Crear directorio de logs si no existe
    mkdir -p "$LOG_DIR"
    
    echo "=== PORT AUDITORIA ====" >> "$LOG_FILE"
    echo "Container: ctjambautocaravaneando_ports" >> "$LOG_FILE"
    echo "Timestamp: $(date)" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    
    # Escanear puertos TCP/UDP abiertos
    echo "=== Listening TCP/UDP ports ===" >> "$LOG_FILE"
    ss -tulpn >> "$LOG_FILE" 2>/dev/null || netstat -tulpn >> "$LOG_FILE" 2>/dev/null
    
    echo "" >> "$LOG_FILE"
    echo "=== Exposed environment ports ===" >> "$LOG_FILE"
    printenv | grep -i port >> "$LOG_FILE" 2>/dev/null || true
    
    echo "" >> "$LOG_FILE"
    echo "=== END AUDITORIA ====" >> "$LOG_FILE"
}

# Funcion para escaneo continuo en background
jambscan(){
    while true; do
        jambload_ciber
        sleep 30
    done
}

# Ejecutar escaneo en background si se llama directamente
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
    jambscan &
fi
