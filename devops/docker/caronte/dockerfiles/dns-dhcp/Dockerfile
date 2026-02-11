# Servidor DNS + DHCP + GUI web Technitium
# GUI: Technitium DNS Server (incluye interfaz web integrada)
ARG INICIALES=crsa
FROM ${INICIALES}ubbase:latest

ENV DEBIAN_FRONTEND=noninteractive

# Instalar .NET Runtime 9.0 requerido por Technitium
RUN apt-get update && apt-get install -y wget apt-transport-https \
    && wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y aspnetcore-runtime-9.0 \
    && rm -rf /var/lib/apt/lists/*

# Instalar Technitium DNS Server con GUI web integrada
RUN wget https://download.technitium.com/dns/DnsServerPortable.tar.gz \
    && mkdir -p /opt/technitium \
    && tar -xzf DnsServerPortable.tar.gz -C /opt/technitium \
    && rm DnsServerPortable.tar.gz

# Copiar script de inicio
COPY dockerfiles/dns-dhcp/start.sh /start.sh
RUN chmod +x /start.sh

# Puertos: DNS(53), DHCP(67), GUI web(5380), SSH(22)
EXPOSE 53/udp 53/tcp 67/udp 5380/tcp 22

ENTRYPOINT ["/start.sh"]
