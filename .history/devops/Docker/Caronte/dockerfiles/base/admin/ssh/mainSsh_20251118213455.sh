#!/bin/bash
set -e

SSH_PORT=${PORT_SSH:-22} 

make_ssh(){
    sed -i "s/#Port 22/Port ${SSH_PORT}/" /etc/ssh/sshd_config 
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
}