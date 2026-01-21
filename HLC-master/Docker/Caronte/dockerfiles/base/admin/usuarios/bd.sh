
# Opcional: prefijo para UID/GID si no vienen en la BD
DEFAULT_BASE_UID=${DEFAULT_BASE_UID:-10000}
DEFAULT_BASE_GID=${DEFAULT_BASE_GID:-10000}

# Ruta temporal para el archivo de usuarios
USERS_FILE="/tmp/users.csv"


# === Conexión a PostgreSQL y extracción de usuarios ===
echo "📡 Conectando a PostgreSQL: $POSTGRES_HOST:$POSTGRES_PORT / $POSTGRES_DB como $POSTGRES_USER"

# Esperar a que PostgreSQL esté disponible
echo "⏳ Esperando a que PostgreSQL esté listo..."
while ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" --no-password; do
    sleep 2
done
echo "✅ PostgreSQL listo"

# Ejecutar consulta para obtener usuarios
echo "📥 Obteniendo usuarios de la tabla User..."

PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -A -F',' << 'EOF' > "$USERS_FILE"
SELECT 
    COALESCE(username, ''),
    COALESCE(password, ''),
    COALESCE(uid::text, ''),
    COALESCE(gid::text, '')
FROM "User"
WHERE username IS NOT NULL AND username != '';
EOF

# Procesar cada usuario
if [[ -s "$USERS_FILE" ]]; then
    while IFS=',' read -r username password uid gid; do
        # Limpiar espacios
        username=$(echo "$username" | xargs)
        password=$(echo "$password" | xargs)
        uid=$(echo "$uid" | xargs)
        gid=$(echo "$gid" | xargs)

        if [[ -n "$username" ]]; then
            create_linux_user "$username" "$password" "$uid" "$gid"
        fi
    done < "$USERS_FILE"
else
    echo "⚠ No se encontraron usuarios en la tabla User o la tabla está vacía."
fi

# Limpiar
rm -f "$USERS_FILE"

# === Ejecutar comando principal ===
echo "🚀 Ejecutando comando: $*"
exec "$@"