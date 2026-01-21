#!/bin/sh

# touch /root/logs/informe.log
load_ciber(){
    LOG_DIR="/root/logs"
    LOG_FILE="$LOG_DIR/${CONTENEDOR}_ports"

    echo "=== PORT AUDITORIA ===" >> "$LOG_FILE"
    echo "Container: ${CONTENEDOR}" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- Listening TCP/UDP ports ---" >> "$LOG_FILE"
    ss -tulnp >> "$LOG_FILE" 2>&1

    echo "" >> "$LOG_FILE"
    echo "--- Exposed environment ports ---" >> "$LOG_FILE"
    printenv | grep -i port >> "$LOG_FILE" 2>/dev/null || true

    echo "" >> "$LOG_FILE"
    echo "=== END AUDITORIA ===" >> "$LOG_FILE"

}

load_entrypoint_base(){
   #ejecutar entrypoint ubbase
   bash /root/admin/base/start.sh

}

scan(){
    while true; do
        load_ciber
        sleep 30
    done
}

main() {
    load_entrypoint_base
    scan &
}

main