# PostgreSQL con soporte LDAP y SSH
FROM dbbase:latest

ENV DEBIAN_FRONTEND=noninteractive

# Copiar script de inicio personalizado
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Puertos: PostgreSQL, SSH
EXPOSE 5432 22

ENTRYPOINT ["/start.sh"]
