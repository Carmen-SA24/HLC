# NestJS sobre imagen de ciberseguridad
# Hereda de: ubbase -> ubsecurity -> este Dockerfile
ARG INICIALES=crsa
FROM ${INICIALES}ubsecurity:latest

ENV DEBIAN_FRONTEND=noninteractive

# Instalar Node.js LTS
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    software-properties-common \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de la app
RUN mkdir -p /app
WORKDIR /app

# Copiar el proyecto NestJS (src compilado)
ARG PROYECTO=nestasir
ARG TIPO=personal
COPY ./proyectos/${TIPO}/${PROYECTO}/src /app

# Copiar script de inicio (entrypoint)
RUN mkdir -p /root/admin/JS/nest
COPY ./dockerfiles/js/nest/start.sh /root/admin/JS/nest/start.sh
RUN chmod +x /root/admin/JS/nest/start.sh

EXPOSE 3001 22

ENTRYPOINT ["/root/admin/JS/nest/start.sh"]
