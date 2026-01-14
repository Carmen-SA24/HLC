#!/bin/bash
# Instalación y configuración de MicroK8s

install_microk8s(){
    echo "INFO: Iniciando instalación de MicroK8s..." >> /root/logs/informe.log
    
    # Actualizar sistema
    apt update && apt upgrade -y >> /root/logs/informe.log 2>&1
    
    # Desactivar swap
    swapoff -a
    sed -i '/ swap / s/^/#/' /etc/fstab
    echo "INFO: Swap desactivado." >> /root/logs/informe.log
    
    # Instalar snap si no está
    if ! command -v snap &> /dev/null; then
        apt install -y snapd
        echo "INFO: Snapd instalado." >> /root/logs/informe.log
    fi
    
    # Instalar MicroK8s
    snap install microk8s --classic >> /root/logs/informe.log 2>&1
    echo "INFO: MicroK8s instalado." >> /root/logs/informe.log
    
    # Agregar usuario al grupo microk8s si existe
    if [ -n "${USUARIO}" ]; then
        usermod -aG microk8s ${USUARIO}
        echo "INFO: Usuario ${USUARIO} agregado al grupo microk8s." >> /root/logs/informe.log
    fi
    
    # Esperar a que MicroK8s esté listo
    echo "INFO: Esperando a que MicroK8s esté listo..." >> /root/logs/informe.log
    microk8s status --wait-ready >> /root/logs/informe.log 2>&1
    
    # Habilitar addons
    echo "INFO: Habilitando addons de MicroK8s..." >> /root/logs/informe.log
    microk8s enable dns ingress storage metrics-server >> /root/logs/informe.log 2>&1
    
    echo "INFO: MicroK8s configurado correctamente." >> /root/logs/informe.log
}

verify_microk8s(){
    echo "======================================"
    echo "Verificación de MicroK8s"
    echo "======================================"
    
    echo -e "\n[Estado de MicroK8s]"
    microk8s status
    
    echo -e "\n[Pods en todos los namespaces]"
    microk8s kubectl get pods -A
    
    echo -e "\n[Nodos del cluster]"
    microk8s kubectl get nodes
    
    echo -e "\n[Servicios]"
    microk8s kubectl get services -A
}
