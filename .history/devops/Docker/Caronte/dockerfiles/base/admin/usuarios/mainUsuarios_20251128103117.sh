#set -e

checkusuario(){
    if grep -q "${USUARIO}" /etc/passwd 
    then
        echo "${USUARIO} se encuentra en el sistema." >> /root/logs/informe.log
        return 1
    else
        echo "${USUARIO} no se encuentra en el sistema." >> /root/logs/informe.log
        return 0
    fi
}

checkhome(){
    if [ ! -d "/home/${USUARIO}" ] 
    then
        echo "El directorio /home/${USUARIO} no existe." >> /root/logs/informe.log
        return 0 # TRUE
    else
        echo "El directorio /home/${USUARIO} ya existe." >> /root/logs/informe.log
        return 1 # FALSO
    fi
}

newUser(){
    checkusuario
    if [ "$?" -eq 0 ] # No existe el usuario y $? Recoge el valor de retorno del ultimo comando ejecutado
    then
        checkhome
        if [ "$?" -eq 0 ] # No existe el home
        then
        useradd -rm -d /home/${USUARIO} -s  /bin/bash ${USUARIO} 
        echo "${USUARIO}:${PASSWORD}" | chpasswd
        echo "Bienvenido ${USUARIO} ..." > /home/${USUARIO}/bienvenida.txt
        echo "---> Usuario ${USUARIO} creado correctamente." >> /root/logs/informe.log
        return 0
        else
        echo "---> Usuario ${USUARIO} no creado. El home ya existe." >> /root/logs/informe.log
        return 1
        fi
    else
        echo "---> Usuario ${USUARIO} no creado. Ya existe en el sistema." >> /root/logs/informe.log
        return 1
    fi

}