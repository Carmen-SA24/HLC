#!/bin/bash
set -e

config_nginx(){
   # Inicia Nginx en segundo plano
   #Para lanzar Nginx en segundo plano y mantener el contenedor activo, n
   #ecesitas un proceso en primer plano que evite que Docker finalice el contenedor. 
   #Nginx, por defecto, se ejecuta como un demonio (en segundo plano), 
   #pero Docker requiere un proceso principal activo en el contenedor.
   # exec nginx -g "daemon off;" 
   nginx &
   # Mantener el contenedor activo ejecutando Nginx en primer plano
   # exec nginx -g "daemon off;"
   # Mantén el contenedor vivo
   #tail -f /dev/null
   echo "nginx levantado en BGROUND en el sistema" >> /root/logs/informe.log
}

#....

load_entrypoint_ciber(){
   #ejecutar entrypoint ubbase
   # bash /root/admin/base/start.sh
   bash /root/admin/security/admin/scan.sh 

  
}

main(){
   load_entrypoint_ciber &
   config_nginx
 
   # tail -f /dev/null 
    
}

main
