# Servidor OpenLDAP con SSH y configuracion base
FROM ubbase:latest

ENV DEBIAN_FRONTEND=noninteractive

# Instalar OpenLDAP server y utilidades
RUN apt-get update && apt-get install -y \
    slapd \
    ldap-utils \
    && rm -rf /var/lib/apt/lists/*

# Directorio para configuraciones personalizadas
RUN mkdir -p /root/admin/ldap

# Copiar script de inicio
COPY dockerfiles/openldap/start.sh /start.sh
RUN chmod +x /start.sh

# Puertos: LDAP, LDAPS, SSH
EXPOSE 389 636 22

ENTRYPOINT ["/start.sh"]
