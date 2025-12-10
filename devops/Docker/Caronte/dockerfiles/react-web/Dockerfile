# Usamos la imagen base 'ubbase' que ya tienes configurada
FROM ubbase:latest

# Evitar interacciones durante la instalación
ENV DEBIAN_FRONTEND=noninteractive

# Instalamos nginx, nodejs y npm
# curl es necesario para instalar nodejs desde nodesource si fuera necesario, 
# pero ubuntu suele traer versiones recientes. Usaremos la standard primero.
RUN apt-get update && apt-get install -y \
    nginx \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Creamos el directorio de la app
WORKDIR /app

# Copiamos el package.json y package-lock.json (si existen) primero para aprovechar caché de Docker
# Asumimos que el contexto de build será la carpeta del proyecto react
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código fuente
COPY . .

# Construimos la aplicación React
RUN npm run build

# Borramos la configuración por defecto de Nginx
RUN rm /etc/nginx/sites-enabled/default

# Copiamos nuestra configuración de Nginx (la crearemos al vuelo o desde archivo)
# Para simplificar, configuramos un bloque server básico aquí
RUN echo 'server { \
    listen 80; \
    root /var/www/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/react.conf

# Copiamos los archivos compilados (dist) a donde Nginx los sirve
RUN cp -r dist/* /var/www/html/

# Exponemos el puerto 80 (Nginx) y 22 (SSH heredado)
EXPOSE 80 22

# Copiamos el script de inicio
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Definimos el entrypoint
ENTRYPOINT ["/start.sh"]
