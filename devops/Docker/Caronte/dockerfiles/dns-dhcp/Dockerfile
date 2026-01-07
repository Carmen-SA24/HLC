# Servidor DNS/DHCP con SSH usando Technitium
FROM ubbase:latest

ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias para Technitium
RUN apt-get update && apt-get install -y \
    wget \
    apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

# Instalar .NET Runtime (requerido por Technitium)
RUN wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y aspnetcore-runtime-8.0 \
    && rm -rf /var/lib/apt/lists/*

# Descargar e instalar Technitium DNS Server
RUN wget https://download.technitium.com/dns/DnsServerPortable.tar.gz \
    && mkdir -p /opt/technitium \
    && tar -xzf DnsServerPortable.tar.gz -C /opt/technitium \
    && rm DnsServerPortable.tar.gz

# Copiar script de inicio personalizado
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Puertos: DNS, DHCP, Web GUI, SSH
EXPOSE 53/udp 53/tcp 67/udp 5380/tcp 22

ENTRYPOINT ["/start.sh"]
