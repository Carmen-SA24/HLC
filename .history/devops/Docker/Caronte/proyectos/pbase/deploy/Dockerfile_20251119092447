# Partimos de una iamgen bash de ubuntu donde instalaremos apache . configuraremos y arrancaremos
FROM ubuntu
ARG USUARIO
ARG PASSWORD
# RUN apt update && apt install -yq --no-install-recommends \ apache2 \ nano \ curl \ net-tools iputils-ping
# **** Instalaciones *****
RUN apt update && apt install -yq --no-install-recommends \ 
apache2 \ 
nano \ 
curl \ 
net-tools iputils-ping

# Cnofiguracion  base

# Configuracion del servicio

# **** Creacion de usuario *****
# comandos interactivos (piden datos por terminal)
# comandos por lote (datos los ponemos como parametros del comando)
RUN useradd -rm -d /home/rosa -s /bin/bash rosa
RUN echo "rosa:1234" | chpasswd
RUN echo "Bienvenida Rosa a la empresa" > /home/rosa/hello.txt

# debemos consultar el docker hub (imagen) para ver variables de entorno directorios de trabajo etc etc
# Directorio de trabajo dentro del contenedor
WORKDIR /var/www/html
# El directorio . es relativo  al contexto del docker
COPY ./src .
EXPOSE 80
CMD apachectl -DFOREGROUND