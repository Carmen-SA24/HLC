# PostgreSQL + GUI web pgAdmin 4
# GUI: pgAdmin 4 (herramienta oficial de gestión PostgreSQL)
ARG INICIALES=crsa
FROM ${INICIALES}dbbase:latest

ENV DEBIAN_FRONTEND=noninteractive

# Instalar pgAdmin 4 para GUI web de gestión PostgreSQL
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    && curl -fsS https://www.pgadmin.org/static/packages_pgadmin_org.pub | gpg --dearmor -o /usr/share/keyrings/packages-pgadmin-org.gpg \
    && sh -c 'echo "deb [signed-by=/usr/share/keyrings/packages-pgadmin-org.gpg] https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" > /etc/apt/sources.list.d/pgadmin4.list' \
    && apt-get update \
    && apt-get install -y pgadmin4-web \
    && rm -rf /var/lib/apt/lists/*

# Configurar pgAdmin en modo web
RUN /usr/pgadmin4/bin/setup-web.sh --yes || true

# Copiar script de inicio
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Puertos: PostgreSQL(5432), pgAdmin web(80), SSH(22)
EXPOSE 5432 80 22

ENTRYPOINT ["/start.sh"]
