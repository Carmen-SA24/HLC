FROM ubuntu

RUN apt update && apt install -yq --no-install-recommends \
     nano \
     git curl  wget \
     iputils-ping net-tools \ 
     sudo \
     openssh-server \
     ca-certificates

# copiar los script's del entrypoint (sc ppal ---> otrs sc' personalizadas)
RUN mkdir -p /root/admin/base
WORKDIR /root/admin/base
# 1 . --> relativo al directorio (base) donde se encuentra ubbase --> docker build 
# COPY ./admin/start.sh .

# 1 . --> realtivo a la ruta del contexto (Caronte) en el docker-compose-yml del proyectbase
# docker compose up -d --build
# 2 . --> workdir dentro del contenedor
RUN mkdir /var/run/sshd
EXPOSE 22

RUN mkdir ./common
COPY ./common/id_ed25519.pub ./common
COPY ./dockerfiles/base/admin .
RUN chmod +x ./start.sh


# el primer comando que ejecuta el contenedor para mantenerse vivo
#CMD ["tail", "-f", "/dev/null"]

ENTRYPOINT [ "./start.sh" ]