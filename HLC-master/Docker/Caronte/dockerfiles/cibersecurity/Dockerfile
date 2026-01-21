FROM morgadoberruezo/ubbase
# aplicaciones de CSeg
RUN apt-get update && apt-get install -y \
    nmap \
    iproute2 \
    net-tools \
    procps \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /root/admin/security
WORKDIR /root/admin/security

COPY ./dockerfiles/cibersecurity .
RUN chmod +x ./admin/scan.sh

ENTRYPOINT ["./admin/scan.sh"]