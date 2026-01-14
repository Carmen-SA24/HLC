#!/bin/bash
# Script de instalación de MicroK8s - Compatible con estructura base

# Cargar funciones base si existen
if [ -f /root/admin/base/kubernetes/maink8s.sh ]; then
    source /root/admin/base/kubernetes/maink8s.sh
    install_microk8s
else
    # Instalación manual si no existe el módulo
    echo "======================================"
    echo "Instalando MicroK8s..."
    echo "======================================"

    # 1. Actualizar sistema
    echo "[1/6] Actualizando sistema..."
    apt update && apt upgrade -y

    # 2. Desactivar swap (corregido)
    echo "[2/6] Desactivando swap..."
    swapoff -a
    sed -i '/ swap / s/^/#/' /etc/fstab

    # 3. Instalar MicroK8s (corregido: --classic)
    echo "[3/6] Instalando MicroK8s..."
    snap install microk8s --classic

    # 4. Configurar usuario (corregido: microk8s)
    echo "[4/6] Configurando usuario..."
    if [ -n "${USUARIO}" ]; then
        usermod -aG microk8s ${USUARIO}
        echo "Usuario ${USUARIO} agregado al grupo microk8s."
    fi

    # 5. Esperar a que MicroK8s esté listo
    echo "[5/6] Esperando a que MicroK8s esté listo..."
    microk8s status --wait-ready

    # 6. Habilitar addons
    echo "[6/6] Habilitando addons..."
    microk8s enable dns ingress storage metrics-server

    echo ""
    echo "======================================"
    echo "Instalación completada!"
    echo "======================================"
    echo ""
    echo "Para verificar, ejecuta: /root/verify.sh"
fi
