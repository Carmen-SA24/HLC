#!/bin/bash
set -e

VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

msg() { printf "${1}${2}${NC}\n"; }

REPO_DIR=~/devops/docker/caronte/proyectos/personal/racer
IMAGE_NAME=carmen24/racer:latest
HELM_RELEASE=racer
HELM_NAMESPACE=racer
COMMIT_HASH_FILE=/tmp/racer_last_deploy_commit

msg "$CYAN" "=========================================="
msg "$CYAN" "DESPLEGANDO RACER - $(date)"
msg "$CYAN" "=========================================="

echo ""
msg "$AMARILLO" "[1/5] Descargando cambios desde GitHub..."
cd "$REPO_DIR"

# Guardar el commit actual ANTES de hacer pull
OLD_COMMIT=$(git rev-parse HEAD)

git pull origin main

# Commit actual DESPUES del pull
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$OLD_COMMIT" == "$NEW_COMMIT" ]; then
    msg "$VERDE" "No hay cambios nuevos en el repositorio."
else
    msg "$VERDE" "OK - Cambios descargados (${OLD_COMMIT:0:7}..${NEW_COMMIT:0:7})"
fi

echo ""
msg "$AMARILLO" "[2/5] Verificando si hay cambios en el codigo fuente..."

# Directorios/archivos que afectan la imagen Docker
WATCH_PATTERNS=(
    "frontend/"
    "backend/"
    "config/"
    "deploy/Dockerfile"
    "deploy/start.sh"
    "requirements.txt"
)

# Obtener archivos modificados entre el commit anterior y el nuevo
CHANGED_FILES=$(git diff --name-only "$OLD_COMMIT".."$NEW_COMMIT" 2>/dev/null || echo "")

# Si no hubo pull (mismo commit), revisar cambios sin commitear tambien
if [ "$OLD_COMMIT" == "$NEW_COMMIT" ]; then
    CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null || echo "")
    # Si no hay cambios sin commit, revisar contra el ultimo deploy conocido
    if [ -z "$CHANGED_FILES" ] && [ -f "$COMMIT_HASH_FILE" ]; then
        LAST_DEPLOY=$(cat "$COMMIT_HASH_FILE")
        CHANGED_FILES=$(git diff --name-only "$LAST_DEPLOY"..HEAD 2>/dev/null || echo "")
    fi
fi

# Determinar si hay cambios relevantes para la imagen
NEEDS_BUILD=false
for pattern in "${WATCH_PATTERNS[@]}"; do
    if echo "$CHANGED_FILES" | grep -q "$pattern"; then
        NEEDS_BUILD=true
        break
    fi
done

# Tambien revisar si es el primer despliegue (no existe el archivo de hash)
if [ ! -f "$COMMIT_HASH_FILE" ]; then
    NEEDS_BUILD=true
    msg "$AMARILLO" "Primer despliegue detectado - se construira la imagen."
fi

if [ "$NEEDS_BUILD" = false ]; then
    msg "$VERDE" "No hay cambios en el codigo fuente. Saltando construccion y subida de imagen."
    echo ""
    msg "$AMARILLO" "[3/5] Saltado - No hay cambios en la imagen"
    msg "$AMARILLO" "[4/5] Actualizando Helm release (por si cambios en valores/helm)..."
else
    echo ""
    msg "$AMARILLO" "[3/5] Reconstruyendo imagen Docker..."
    docker build -t "$IMAGE_NAME" -f deploy/Dockerfile .
    msg "$VERDE" "OK - Imagen construida"

    echo ""
    msg "$AMARILLO" "[4/5] Subiendo imagen a Docker Hub..."
    docker push "$IMAGE_NAME"
    msg "$VERDE" "OK - Imagen subida"
fi

echo ""
msg "$AMARILLO" "[5/5] Actualizando Helm release..."
helm upgrade "$HELM_RELEASE" ./deploy/helm -n "$HELM_NAMESPACE"
msg "$VERDE" "OK - Helm release actualizado"

echo ""
msg "$AMARILLO" "[6/5] Verificando que los pods esten funcionando..."
kubectl wait --for=condition=Ready pods -l app.kubernetes.io/instance="$HELM_RELEASE" -n "$HELM_NAMESPACE" --timeout=120s
msg "$VERDE" "OK - Pods funcionando"

# Guardar el commit actual como ultimo deploy exitoso
echo "$NEW_COMMIT" > "$COMMIT_HASH_FILE"

echo ""
msg "$CYAN" "=========================================="
msg "$VERDE" "DESPLIEGUE COMPLETADO - $(date)"
msg "$CYAN" "=========================================="
msg "$CYAN" "http://racer-gestion.es"
