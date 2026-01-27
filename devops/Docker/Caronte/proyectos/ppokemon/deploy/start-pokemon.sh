#!/bin/bash
# Iniciar Next.js en background
cd /app && npm start &

# Iniciar script base de seguridad
exec /root/admin/base/start.sh