#!/bin/bash
# Script de verificación de servicios

echo "=== Health Check de Servicios ==="
echo ""

check_service() {
    local name=$1
    local port=$2
    
    if nc -zv localhost $port 2>/dev/null; then
        echo "✅ $name - OK (puerto $port)"
    else
        echo "❌ $name - ERROR (puerto $port)"
    fi
}

check_service "FTP" 21
check_service "FTP GUI (Webmin)" 10000
check_service "DNS" 53
check_service "DNS/DHCP GUI (Technitium)" 5380
check_service "PostgreSQL" 5432
check_service "PostgreSQL GUI (pgAdmin)" 80
check_service "SSH" 22

echo ""
echo "=== Contenedores activos ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Recursos del sistema ==="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' 2>/dev/null || echo 'N/A')"
echo "RAM: $(free -h | awk '/^Mem:/ {print $3 "/" $2}' 2>/dev/null || echo 'N/A')"
echo "Disco: $(df -h / | awk 'NR==2 {print $3 "/" $2}' 2>/dev/null || echo 'N/A')"
