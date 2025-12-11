# Etapa 1: Construcción (Node.js)
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código y compilar la app
COPY . .
RUN npm run build

# Etapa 2: Imagen Final (Base personalizada)
FROM ubbase:latest

ENV DEBIAN_FRONTEND=noninteractive

# Instalar Nginx
RUN apt-get update && apt-get install -y \
    nginx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

# Limpiar config por defecto
RUN rm /etc/nginx/sites-enabled/default

# Configuración básica de Nginx
RUN echo 'server { \
    listen 80; \
    root /var/www/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/react.conf

# Copiar web compilada desde la Etapa 1
COPY --from=builder /app/dist /var/www/html/

# Exponer puertos web y SSH
EXPOSE 80 22

# Script de arranque
COPY start.sh /start.sh
RUN chmod +x /start.sh

ENTRYPOINT ["/start.sh"]
