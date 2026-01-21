#!/bin/bash
set -e


load_entrypoint_nginx(){
   #ejecutar entrypoint ngin. Invoca a EP de base, configura nginx y lanza nginx &
   # bash /root/admin/base/start.sh
   bash /root/admin/sweb/nginx/admin/start.sh
   
}


config_react(){
   echo "*** Imagen de React *******" >> /root/logs/informe.log
   #  cd /root/${USUARIO}/app/${PROYECTO}
   cd /app
   echo "* Dentro de ${PROYECTO}..." >> /root/logs/informe.log
    
   npm install -g npm@11.7.0
   echo "* npm@11.7.0 instalado ..." >> /root/logs/informe.log
   # Verifica si React con TypeScript ya está inicializado
   if [ ! -d "node_modules" ]; then
      # Ejecutar npm install
      npm install 
      if [ $? -ne 0 ]; then
         echo "Error al instalar dependencias. Abortando." >> /root/logs/informe.log
         exit 1
      fi
      echo "dependencias instaladas..." >> /root/logs/informe.log
      # Ejecutar npm start
      npm start &
      if [ $? -ne 0 ]; then
         echo "Error al iniciar la aplicación. Abortando."
         exit 1
      fi
      echo "Iniciando la aplicación en 3000.." >> /root/logs/informe.log
   fi
  
   if [ ! -d "build" ]; then
      echo "Construyendo la aplicación React para producción..." >> /root/logs/informe.log
      # Ejecutar npm run build
      npm run build 2>/dev/null || true
      if [ $? -ne 0 ]; then
            echo "Error al construir la aplicación.">> /root/logs/informe.log
            exit 1
      fi
      # Mover al html
      cp -r ./build/* /var/www/html
      # echo "Build movido a /var/www/html... Sirviendo nginx" >> /root/logs/informe.log
      chown -R www-data /var/www/html
      # echo "propiedad del www-data /var/www/html..." >> /root/logs/informe.log
      chmod -R 755  /var/www/html
      # echo "755 /var/www/html... Sirviendo nginx" >> /root/logs/informe.log
      # echo "Build movido a /var/www/html... Sirviendo nginx" >> /root/logs/informe.log
      echo "Todo completado exitosamente.">> /root/logs/informe.log
   fi
   
}

main(){
   # tail -f /dev/null
   load_entrypoint_nginx &
    echo "***** RECT ******" >> /root/logs/informe.log
   

   # install_node
   # config_git
   config_react

   # tail -f /dev/null
}

main