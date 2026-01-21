#!/bin/bash
#set -e

check_usuario(){
    if grep -q "${USUARIO}" /etc/passwd
    then    
        echo "${USUARIO} se encuentra en el sistema" >> /root/logs/informe.log
        return 1
    else
        echo "${USUARIO} no se encuentra en el sistema" >> /root/logs/informe.log
        return 0
    fi
}

check_home(){
    if [ ! -d "/home/${USUARIO}" ]
    then
        echo "/home/${USUARIO} no existe" >> /root/logs/informe.log
        return 0 #true
    else
        echo "/home/${USUARIO} existe" >> /root/logs/informe.log
        return 1 #false
    fi
}
newUser(){
    check_usuario
    # `cat /et/password | grep morgado`
    if [ "$?" -eq 0 ] #no existe usuario en passwd
    then 
        check_home
        if [ "$?" -eq 0 ]
        then
            useradd -rm -d /home/${USUARIO} -s /bin/bash ${USUARIO}
            echo "${USUARIO}:${PASSWORD}" | chpasswd
            echo "Bienvenido ${USUARIO} a tu empresa ..." > /home/${USUARIO}/bienvenida.txt
            echo "--> Usario ${USUARIO} creado" >> /root/logs/informe.log
            return 0
        else
            echo "--> Usuario ${USUARIO} No creado, existe home" >> /root/logs/informe.log
            return 1
        fi
    else
        echo "--> Usuario ${USUARIO} No creado, existe en passwd" >> /root/logs/informe.log
        return 1
    fi  
}