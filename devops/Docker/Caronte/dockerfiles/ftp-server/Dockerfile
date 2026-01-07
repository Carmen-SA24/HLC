# Servidor FTP con soporte LDAP y SSH
FROM ftpbase:latest

ENV DEBIAN_FRONTEND=noninteractive

# Copiar configuracion de vsftpd
COPY vsftpd.conf /etc/vsftpd.conf

# Copiar script de inicio personalizado
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Crear directorio para datos FTP
RUN mkdir -p /srv/ftp

# Puertos: FTP, FTP pasivo, SSH
EXPOSE 21 21000-21010 22

ENTRYPOINT ["/start.sh"]
