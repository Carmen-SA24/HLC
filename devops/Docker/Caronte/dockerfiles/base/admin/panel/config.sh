#!/bin/bash
# Configuración del panel de administración centralizado

config_panel(){
    # Configurar acceso a servicios externos
    cat > /etc/cockpit/cockpit.conf <<EOF
[WebService]
Origins = https://localhost:9090 http://localhost:9090
ProtocolHeader = X-Forwarded-Proto
AllowUnencrypted = true

[Services]
# Enlaces a servicios
FTP = http://localhost:10000
DNS_DHCP = http://localhost:5380
PostgreSQL = http://localhost:80
EOF

    # Crear dashboard personalizado
    mkdir -p /usr/share/cockpit/dashboard
    cat > /usr/share/cockpit/dashboard/manifest.json <<EOF
{
    "version": 0,
    "name": "dashboard",
    "description": "Panel de servicios integrados",
    "bridges": [{"spawn": ["/usr/bin/cockpit-bridge"]}]
}
EOF

    echo "Panel configurado en puerto 9090"
}

config_panel
