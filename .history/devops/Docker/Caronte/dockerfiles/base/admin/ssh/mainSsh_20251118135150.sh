#!/bin/bash
# carga las varialbes de entorno pasadas desde el docker-compose.yml
set -e

make_ssh(){
    sed -i 's/#Port 22/Port 2345/' /etc/ssh/sshd_config 
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
}