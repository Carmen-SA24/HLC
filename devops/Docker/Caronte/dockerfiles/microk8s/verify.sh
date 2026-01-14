#!/bin/bash
# Script de verificación de MicroK8s - Compatible con estructura base

# Cargar funciones base si existen
if [ -f /root/admin/base/kubernetes/maink8s.sh ]; then
    source /root/admin/base/kubernetes/maink8s.sh
    verify_microk8s
else
    # Verificación manual si no existe el módulo
    echo "======================================"
    echo "Verificando MicroK8s..."
    echo "======================================"
    echo ""

    # Verificar estado
    echo "1. Estado de MicroK8s:"
    echo "----------------------"
    microk8s status
    echo ""

    # Verificar versión
    echo "2. Versión de Kubernetes:"
    echo "-------------------------"
    microk8s kubectl version --short 2>/dev/null || microk8s kubectl version
    echo ""

    # Verificar nodos
    echo "3. Nodos del cluster:"
    echo "---------------------"
    microk8s kubectl get nodes
    echo ""

    # Verificar todos los pods
    echo "4. Pods en todos los namespaces:"
    echo "--------------------------------"
    microk8s kubectl get pods -A
    echo ""

    # Verificar servicios
    echo "5. Servicios:"
    echo "-------------"
    microk8s kubectl get services -A
    echo ""

    # Verificar addons habilitados
    echo "6. Addons habilitados:"
    echo "----------------------"
    microk8s status | grep -A 20 "addons:"
    echo ""

    echo "======================================"
    echo "Verificación completada!"
    echo "======================================"
fi
