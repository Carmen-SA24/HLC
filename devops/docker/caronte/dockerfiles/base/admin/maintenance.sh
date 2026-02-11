#!/bin/bash
# Scripts de mantenimiento optimizado para todos los servicios

# Health check automatizado
health_check(){
    local service=$1
    local port=$2
    
    if nc -zv localhost $port 2>/dev/null; then
        echo "✓ $service OK en puerto $port"
        return 0
    else
        echo "✗ $service ERROR en puerto $port"
        return 1
    fi
}

# Monitor de recursos
monitor_resources(){
    echo "=== Recursos del sistema ==="
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
    echo "RAM: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
    echo "Disco: $(df -h / | awk 'NR==2 {print $3 "/" $2}')"
}

# Verificar todos los servicios
check_all_services(){
    echo "=== Health Check de Servicios ==="
    health_check "FTP" 21
    health_check "FTP-GUI" 10000
    health_check "DNS" 53
    health_check "DNS-GUI" 5380
    health_check "PostgreSQL" 5432
    health_check "PgAdmin" 80
    health_check "Nginx" 80
    health_check "Node" 3000
    health_check "Panel" 9090
    health_check "SSH" 22
}

# Limpieza automatizada
auto_cleanup(){
    echo "=== Limpieza de sistema ==="
    apt-get autoremove -y
    apt-get autoclean -y
    docker system prune -f
    journalctl --vacuum-time=7d
    echo "Limpieza completada"
}

# Backup automatizado
auto_backup(){
    local backup_dir="/backup/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $backup_dir
    
    echo "=== Backup en $backup_dir ==="
    [ -d /etc ] && cp -r /etc $backup_dir/
    [ -d /var/www/html ] && cp -r /var/www/html $backup_dir/
    [ -f /root/logs/informe.log ] && cp /root/logs/informe.log $backup_dir/
    
    echo "Backup completado"
}

# Ejecutar según parámetro
case "$1" in
    check)
        check_all_services
        ;;
    monitor)
        monitor_resources
        ;;
    cleanup)
        auto_cleanup
        ;;
    backup)
        auto_backup
        ;;
    all)
        check_all_services
        monitor_resources
        ;;
    *)
        echo "Uso: $0 {check|monitor|cleanup|backup|all}"
        exit 1
        ;;
esac
