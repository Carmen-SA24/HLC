FROM ubuntu
ARG USUARIO
# RUN apt update && apt install -yq --no-install-recommends \ apache2 \ nano \ curl \ net-tools iputils-ping
# **** Instalaciones *****
RUN apt update && apt install -yq --no-install-recommends \ 
nano \
git  curl  wget \
iputils-ping net-tools \
sudo

# Create user using the value of ARG USUARIO
# Note: ${USUARIO} is the correct way to reference the ARG value
RUN useradd -rm -d /home/${USUARIO} -s /bin/bash ${USUARIO} 
RUN useradd -rm -d /home/{USUARIO} -s /bin/bash {USUARIO}
RUN echo "${USUARIO}:1234" | chpasswd
RUN echo "Bienvenida ${USUARIO} a la empresa" > /home/{USUARIO}/hello.txt