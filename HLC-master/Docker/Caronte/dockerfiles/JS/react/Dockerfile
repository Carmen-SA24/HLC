FROM morgadoberruezo/ubnginx

ARG PROYECTO
ARG USUARIO
ARG TIPO
# Actualiza los paquetes e instala herramientas necesarias
RUN apt-get update && apt-get install -y curl gnupg software-properties-common

# Añade el repositorio oficial de Node.js (versión 16 LTS o ajusta a tu necesidad)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Instala Node.js (esto incluye npm)
RUN apt-get install -y nodejs

# RUN npm install -g npm@latest

# no crearlo en /home pq el usuario morgado no se crea en esta etapa
RUN mkdir -p /root/${USUARIO}/app
RUN mkdir -p /app

# COPY ./proyectos/${TIPO}/${PROYECTO}/src /root/${USUARIO}/app/${PROYECTO}
COPY ./proyectos/${TIPO}/${PROYECTO}/src /app
RUN chmod o+x /app

EXPOSE 3000
RUN mkdir -p /root/admin/JS/react
COPY ./dockerfiles/JS/react /root/admin/JS/react
RUN chmod +x /root/admin/JS/react/admin/start.sh
WORKDIR /root/admin/JS/react
ENTRYPOINT ["./admin/start.sh"]