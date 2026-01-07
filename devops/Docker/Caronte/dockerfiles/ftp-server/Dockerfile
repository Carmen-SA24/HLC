# Servidor FTP + GUI web Webmin
# GUI: Webmin (gestión FTP vía web)
FROM ftpbase:latest

ENV DEBIAN_FRONTEND=noninteractive

# Instalar Webmin para GUI web de gestión FTP
RUN apt-get update && apt-get install -y \
    wget \
    perl \
    libnet-ssleay-perl \
    openssl \
    libauthen-pam-perl \
    libpam-runtime \
    libio-pty-perl \
    apt-show-versions \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN wget http://prdownloads.sourceforge.net/webadmin/webmin_2.105_all.deb \
    && dpkg -i webmin_2.105_all.deb || apt-get -f install -y \
    && rm webmin_2.105_all.deb

# Copiar configuración de vsftpd
COPY vsftpd.conf /etc/vsftpd.conf

# Copiar script de inicio
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Crear directorio FTP
RUN mkdir -p /srv/ftp

# Puertos: FTP(21), FTP pasivo, SSH(22), Webmin(10000)
EXPOSE 21 21000-21010 22 10000

ENTRYPOINT ["/start.sh"]
