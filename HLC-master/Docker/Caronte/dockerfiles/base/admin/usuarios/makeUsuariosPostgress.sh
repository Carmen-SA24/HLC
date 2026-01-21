
#!/bin/bash
set -euo pipefail

echo "########### bd ##############">> /root/logs/informe.log
# === Variables de entorno (obligatorias) ===
echo "${USUARIO} se encuentra en el sistema" >> /root/logs/informe.log
echo "${POSTGRES_HOST:?Debe especificar POSTGRES_HOST}" >> /root/logs/informe.log
echo  "${POSTGRES_PORT:=5432}" >> /root/logs/informe.log
echo  "${POSTGRES_DB:?Debe especificar POSTGRES_DB}" >> /root/logs/informe.log
echo "${POSTGRES_USER:?Debe especificar POSTGRES_USER}" >> /root/logs/informe.log
echo  "${POSTGRES_PASSWORD:?Debe especificar POSTGRES_PASSWORD}" >> /root/logs/informe.log


# === Conexión a PostgreSQL y extracción de usuarios ===
echo "📡 Conectando a PostgreSQL: $POSTGRES_HOST:$POSTGRES_PORT / $POSTGRES_DB como $POSTGRES_USER"

# Esperar a que PostgreSQL esté disponible
echo "⏳ Esperando a que PostgreSQL esté listo..."
while ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" --no-password; do
    sleep 2
done
echo "✅ PostgreSQL listo"