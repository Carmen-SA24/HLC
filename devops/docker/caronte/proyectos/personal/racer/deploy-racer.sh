#!/bin/bash
set -e

VERDE='\033[0;32m'; AMARILLO='\033[1;33m'; ROJO='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
msg() { printf "${1}${2}${NC}\n"; }

REPO_DIR=~/devops/docker/caronte/proyectos/personal/racer
IMAGE_NAME=carmen24/racer:latest
HELM_RELEASE=racer; HELM_NAMESPACE=racer
COMMIT_HASH_FILE=/tmp/racer_last_deploy_commit

# --- Auto-update: git pull + restaurar permisos ---
cd "$REPO_DIR"
OLD_CHECKSUM=$(md5sum "$0" 2>/dev/null | cut -d' ' -f1)
git pull origin main 2>&1 | grep -v "Already up to date" || true
chmod +x "$0"  # git pull quita permisos, los restauramos
NEW_CHECKSUM=$(md5sum "$0" 2>/dev/null | cut -d' ' -f1)
if [ "$OLD_CHECKSUM" != "$NEW_CHECKSUM" ]; then
    msg "$AMARILLO" "Script actualizado. Re-ejecutando..."
    exec bash "$0" "$@"
fi

msg "$CYAN" "=========================================="
msg "$CYAN" "DESPLEGANDO RACER - $(date)"
msg "$CYAN" "=========================================="

echo ""
msg "$AMARILLO" "[1/5] Buscando cambios desde ultimo deploy..."

# Archivos que afectan la imagen Docker
WATCH_PATTERNS=("frontend/" "backend/" "config/" "deploy/Dockerfile" "deploy/start.sh" "requirements.txt")

# Comparar contra ultimo deploy registrado
if [ -f "$COMMIT_HASH_FILE" ]; then
    LAST_DEPLOY=$(cat "$COMMIT_HASH_FILE")
    CHANGED_FILES=$(git diff --name-only "$LAST_DEPLOY"..HEAD 2>/dev/null || echo "")
else
    CHANGED_FILES=$(git diff --name-only HEAD~1..HEAD 2>/dev/null || echo "")
fi

# Ver si hay cambios en archivos relevantes para la imagen
NEEDS_BUILD=false
for pattern in "${WATCH_PATTERNS[@]}"; do
    if echo "$CHANGED_FILES" | grep -q "$pattern"; then
        NEEDS_BUILD=true
        break
    fi
done

if [ "$NEEDS_BUILD" = false ]; then
    msg "$VERDE" "Sin cambios en frontend/backend/config/Dockerfile. Saltando build y push."
    echo ""
    msg "$AMARILLO" "[2/5] Saltado"
    msg "$AMARILLO" "[3/5] Helm upgrade..."
else
    echo ""
    msg "$AMARILLO" "[2/5] docker build..."
    docker build -t "$IMAGE_NAME" -f deploy/Dockerfile .
    msg "$VERDE" "OK"

    echo ""
    msg "$AMARILLO" "[3/5] docker push..."
    docker push "$IMAGE_NAME"
    msg "$VERDE" "OK"
fi

echo ""
msg "$AMARILLO" "[4/5] helm upgrade..."
helm upgrade "$HELM_RELEASE" ./deploy/helm -n "$HELM_NAMESPACE"
msg "$VERDE" "OK"

echo ""
msg "$AMARILLO" "[5/5] Verificando pods..."
kubectl wait --for=condition=Ready pods -l app.kubernetes.io/instance="$HELM_RELEASE" -n "$HELM_NAMESPACE" --timeout=120s
msg "$VERDE" "OK"

git rev-parse HEAD > "$COMMIT_HASH_FILE"

echo ""
msg "$CYAN" "=========================================="
msg "$VERDE" "DESPLIEGUE COMPLETADO - $(date)"
msg "$CYAN" "=========================================="
msg "$CYAN" "http://racer-gestion.es"
