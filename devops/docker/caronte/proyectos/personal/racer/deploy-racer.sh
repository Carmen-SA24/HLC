#!/bin/bash
set -e

VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

msg() { printf "${1}${2}${NC}\n"; }

msg "$CYAN" "=========================================="
msg "$CYAN" "DESPLEGANDO RACER - $(date)"
msg "$CYAN" "=========================================="

echo ""
msg "$AMARILLO" "[1/5] Descargando cambios desde GitHub..."
cd ~/devops/docker/caronte/proyectos/personal/racer
git pull origin main
msg "$VERDE" "OK - Cambios descargados"

echo ""
msg "$AMARILLO" "[2/5] Reconstruyendo imagen Docker..."
echo "/* $(date) */" >> frontend/app/dashboard/dashboard.module.css
docker build -t carmen24/racer:latest -f deploy/Dockerfile .
head -n -1 frontend/app/dashboard/dashboard.module.css > /tmp/dashboard.module.css
mv /tmp/dashboard.module.css frontend/app/dashboard/dashboard.module.css
msg "$VERDE" "OK - Imagen construida"

echo ""
msg "$AMARILLO" "[3/5] Subiendo imagen a Docker Hub..."
docker push carmen24/racer:latest
msg "$VERDE" "OK - Imagen subida"

echo ""
msg "$AMARILLO" "[4/5] Actualizando Helm release..."
helm upgrade racer ./deploy/helm -n racer
msg "$VERDE" "OK - Helm release actualizado"

echo ""
msg "$AMARILLO" "[5/5] Verificando que los pods esten funcionando..."
kubectl wait --for=condition=Ready pods -l app.kubernetes.io/instance=racer -n racer --timeout=120s
msg "$VERDE" "OK - Pods funcionando"

echo ""
msg "$CYAN" "=========================================="
msg "$VERDE" "DESPLIEGUE COMPLETADO - $(date)"
msg "$CYAN" "=========================================="
msg "$CYAN" "http://racer-gestion.es"
