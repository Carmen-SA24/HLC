#!/bin/bash
# carga las varialbes de entorno pasadas desde el docker-compose.yml
set -e

make_ssh(){
    set -i 's/#Port 22/Port 2222/' 
}