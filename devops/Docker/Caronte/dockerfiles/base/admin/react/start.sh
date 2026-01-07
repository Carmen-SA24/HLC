#!/bin/bash
# Configuración y despliegue de proyectos React/Vue/Angular

config_react(){
    cd /app
    
    # Instalar dependencias si no existen
    [ ! -d "node_modules" ] && npm install
    
    # Ejecutar desarrollo en puerto 3000
    npm start &
    
    # Generar build de producción
    [ ! -d "build" ] && npm run build
    
    # Desplegar a nginx
    cp -r build/* /var/www/html/
    chown -R www-data:www-data /var/www/html
    chmod -R 755 /var/www/html
}

main() {
    /root/admin/base/start.sh &
    config_react
    nginx -g 'daemon off;'
}

main
