#!/bin/bash

# encargada de dejar este contenedor vivo en background 
tail -f /dev/null

## script's que se encargan de configurar el imagen/contenedor al iniciarse
# RUN useradd -rm -d /home/${USUARIO} -s /bin/bash ${USUARIO}
# RUN echo "${USUARIO}:1234" | chpasswd
# RUN echo "Bienvenida ${USUARIO} a la empresa" > /home/${USUARIO}/hello.txt