#!/bin/bash
# Configuración del panel de administración centralizado

config_panel(){
    # Configurar acceso a servicios externos
    cat > /etc/cockpit/cockpit.conf <<EOF
[WebService]
Origins = https://localhost:9090 http://localhost:9090
ProtocolHeader = X-Forwarded-Proto
AllowUnencrypted = true
EOF

    echo "Panel configurado en puerto 9090"
}

config_panel
