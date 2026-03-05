# PostgreSQL con herencia de ciberseguridad
ARG INICIALES=crsa
FROM ${INICIALES}ubsecurity:latest

ENV DEBIAN_FRONTEND=noninteractive

# Instalar PostgreSQL
RUN apt-get update && apt-get install -y \
    postgresql \ 
    postgresql-contrib \
    && rm -rf /var/lib/apt/lists/*

# Instalar pgAdmin 4
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    lsb-release \
    && curl -fsS https://www.pgadmin.org/static/packages_pgadmin_org.pub | gpg --dearmor -o /usr/share/keyrings/packages-pgadmin-org.gpg \
    && sh -c 'echo "deb [signed-by=/usr/share/keyrings/packages-pgadmin-org.gpg] https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" > /etc/apt/sources.list.d/pgadmin4.list' \
    && apt-get update \
    && apt-get install -y pgadmin4-web \
    && rm -rf /var/lib/apt/lists/*

RUN /usr/pgadmin4/bin/setup-web.sh --yes || true

COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 5432 80 22

ENTRYPOINT ["/start.sh"]
