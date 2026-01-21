#!/bin/bash
# Iniciar Nginx
service nginx start

# Iniciar script base de seguridad
exec /root/admin/base/start.sh
