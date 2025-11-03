FROM ubuntu
ARG USUARIO
ARG PASSWORD
# RUN apt update && apt install -yq --no-install-recommends \ apache2 \ nano \ curl \ net-tools iputils-ping
# **** Instalaciones *****
RUN apt update && apt install -yq --no-install-recommends \ 
nano \
git  curl  wget \
iputils-ping net-tools \
sudo

RUN useradd -rm -d /home/rosa -s /bin/bash rosa
RUN echo "rosa:1234" | chpasswd
RUN echo "Bienvenida Rosa a la empresa" > /home/rosa/hello.txt