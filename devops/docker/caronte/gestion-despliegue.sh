#!/bin/bash
# ============================================================
# gestion-despliegue.sh — Script gestor de comprobación del clúster
# Proyecto: NestJS + PostgreSQL + ppokemon (NextJS)
# Alumna: Carmen ASIR 24
# ============================================================

NAMESPACE="nest"
API_NEST="http://api.carmenasir.com"         # NestJS API + frontend
URL_PPOKEMON="http://pokemon.carmenasir.com" # Proyecto Next.js ppokemon
SSH_PORT_NEST="31535"
SSH_PORT_POSTGRES="31536"
VPS_IP="161.97.152.19"


# ── Colores ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

sep()    { echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
title()  { echo -e "\n${PURPLE}${BOLD}▶ $1${NC}\n"; }
ok()     { echo -e "${GREEN}  ✔ $1${NC}"; }
info()   { echo -e "${YELLOW}  ℹ $1${NC}"; }
esperar(){ echo ""; echo -ne "${CYAN}  [Presiona ENTER para continuar...]${NC}"; read; }

header() {
    clear
    echo ""
    echo -e "${PURPLE}${BOLD}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}${BOLD}║  DEMO — NestJS + PostgreSQL HA en Kubernetes       ║${NC}"
    echo -e "${PURPLE}${BOLD}║  Carmen ASIR 24  ·  Seguridad y DA                 ║${NC}"
    echo -e "${PURPLE}${BOLD}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
}

menu() {
    sep
    echo -e "${YELLOW}${BOLD}  MENÚ DE OPCIONES${NC}"
    echo ""
    echo "  ${BOLD}── PARTE 1: Despliegue ──────────────────────────────${NC}"
    echo "  1) Forzar actualización a la última imagen (helm upgrade)"
    echo "  2) Ver todos los despliegues en el namespace"
    echo "  3) Ver estado detallado de los pods"
    echo ""
    echo "  ${BOLD}── PARTE 2: Herencia de Ciberseguridad ─────────────${NC}"
    echo "  4) kubectl exec → comprobar usuarios y herencia"
    echo "  5) SSH externo → acceso con admin-pod (NestAPI)"
    echo "  6) SSH externo → acceso con admin-pod (PostgreSQL)"
    echo ""
    echo "  ${BOLD}── PARTE 3: API y Frontend ─────────────────────────${NC}"
    echo "  7) Verificar datos de la API (pokemon + peliculas)"
    echo "  8) Verificar replicación PostgreSQL activa"
    echo ""
    echo "  ${BOLD}── PARTE 4: Alta Disponibilidad ────────────────────${NC}"
    echo "  9) HA TEST: Eliminar pod NestAPI (Deployment)"
    echo " 10) HA TEST: Eliminar PRIMARY PostgreSQL (pod-0)"
    echo " 11) HA TEST: Eliminar REPLICA PostgreSQL (pod-1)"
    echo ""
    echo "  0) Salir"
    sep
    echo -ne "${YELLOW}  Opción: ${NC}"
}

case_demo() {
    case $1 in

    # ── PARTE 1: Despliegue ──────────────────────────────────
    1)
        title "Actualizando a la última versión de las imágenes"
        info "ImagePullPolicy: Always → Kubernetes descarga la imagen más reciente"
        echo ""
        info "Actualizando NestAPI..."
        kubectl rollout restart deployment deploy-nestapi -n $NAMESPACE
        info "Actualizando ppokemon..."
        kubectl rollout restart deployment deploy-ppokemon -n $NAMESPACE
        info "Actualizando PostgreSQL..."
        kubectl rollout restart statefulset statefull-nestapi-postgres -n $NAMESPACE
        echo ""
        info "Esperando que los pods arranquen con la nueva imagen..."
        sleep 5
        kubectl get pods -n $NAMESPACE
        echo ""
        info "Verificando imagen usada en cada pod:"
        echo ""
        echo -e "  ${BOLD}NestAPI:${NC}"
        kubectl get pod -l app=nestapi -n $NAMESPACE -o jsonpath='{range .items[*]}  {.metadata.name}: {.spec.containers[0].image}{"\n"}{end}'
        echo -e "\n  ${BOLD}ppokemon:${NC}"
        kubectl get pod -l app=ppokemon -n $NAMESPACE -o jsonpath='{range .items[*]}  {.metadata.name}: {.spec.containers[0].image}{"\n"}{end}'
        echo -e "\n  ${BOLD}PostgreSQL:${NC}"
        kubectl get pod -l app=nestapi-postgres -n $NAMESPACE -o jsonpath='{range .items[*]}  {.metadata.name}: {.spec.containers[0].image}{"\n"}{end}'
        ;;

    2)
        title "Despliegues en el namespace '$NAMESPACE'"
        echo -e "  ${BOLD}Deployments (NestAPI, ppokemon):${NC}"
        kubectl get deployments -n $NAMESPACE
        echo ""
        echo -e "  ${BOLD}StatefulSets (PostgreSQL HA):${NC}"
        kubectl get statefulsets -n $NAMESPACE
        echo ""
        echo -e "  ${BOLD}Services:${NC}"
        kubectl get svc -n $NAMESPACE
        echo ""
        echo -e "  ${BOLD}PersistentVolumeClaims (datos persistentes):${NC}"
        kubectl get pvc -n $NAMESPACE
        ;;

    3)
        title "Estado detallado de todos los pods"
        kubectl get pods -n $NAMESPACE -o wide
        echo ""
        info "Pods de PostgreSQL:"
        echo -e "  ${GREEN}statefull-nestapi-postgres-0${NC} → PRIMARY (lectura/escritura + WAL sender)"
        echo -e "  ${CYAN}statefull-nestapi-postgres-1${NC} → REPLICA (hot standby, sincronizada via WAL)"
        ;;

    # ── PARTE 2: Herencia de Ciberseguridad ──────────────────
    4)
        title "Herencia de ciberseguridad vía kubectl exec (NestAPI y PostgreSQL)"
        
        # --- 1) Comprobación en NestAPI ---
        NEST_POD=$(kubectl get pod -l app=nestapi -n $NAMESPACE -o name | head -1)
        info "Accediendo al pod de NestAPI: $NEST_POD"
        echo ""
        echo -e "  ${BOLD}# 1. Verificar usuario admin-pod (/etc/passwd y id):${NC}"
        kubectl exec -n $NAMESPACE $NEST_POD -- grep admin-pod /etc/passwd
        kubectl exec -n $NAMESPACE $NEST_POD -- id admin-pod
        echo ""
        echo -e "  ${BOLD}# 2. Verificar que sshd está instalado y configurado:${NC}"
        kubectl exec -n $NAMESPACE $NEST_POD -- which sshd
        kubectl exec -n $NAMESPACE $NEST_POD -- grep -i "^port" /etc/ssh/sshd_config
        echo ""
        echo -e "  ${BOLD}# 3. SSH daemon en ejecución:${NC}"
        kubectl exec -n $NAMESPACE $NEST_POD -- ps aux | grep -v grep | grep sshd
        echo ""

        esperar

        # --- 2) Comprobación en PostgreSQL (PRIMARY) ---
        PG_POD="statefull-nestapi-postgres-0"
        info "Accediendo al pod de PostgreSQL: $PG_POD"
        echo ""
        echo -e "  ${BOLD}# 1. Verificar usuario admin-pod (/etc/passwd y id):${NC}"
        kubectl exec -n $NAMESPACE $PG_POD -- grep admin-pod /etc/passwd
        kubectl exec -n $NAMESPACE $PG_POD -- id admin-pod
        echo ""
        echo -e "  ${BOLD}# 2. Verificar que sshd está instalado y configurado:${NC}"
        kubectl exec -n $NAMESPACE $PG_POD -- which sshd
        kubectl exec -n $NAMESPACE $PG_POD -- grep -i "^port" /etc/ssh/sshd_config
        echo ""
        echo -e "  ${BOLD}# 3. SSH daemon en ejecución:${NC}"
        kubectl exec -n $NAMESPACE $PG_POD -- ps aux | grep -v grep | grep sshd
        echo ""
        ;;

    5)
        title "SSH externo → NestAPI (puerto $SSH_PORT_NEST)"
        info "Conectando como admin-pod al pod de NestAPI..."
        info "Comando: ssh -p $SSH_PORT_NEST admin-pod@$VPS_IP"
        echo ""
        info "La contraseña es: 1234"
        echo ""
        ssh -o PubkeyAuthentication=no -p $SSH_PORT_NEST admin-pod@$VPS_IP
        ;;

    6)
        title "SSH externo → PostgreSQL PRIMARY (puerto $SSH_PORT_POSTGRES)"
        info "Conectando como admin-pod al pod PostgreSQL (pod-0)..."
        info "Comando: ssh -p $SSH_PORT_POSTGRES admin-pod@$VPS_IP"
        echo ""
        info "La contraseña es: 1234"
        echo ""
        ssh -o PubkeyAuthentication=no -p $SSH_PORT_POSTGRES admin-pod@$VPS_IP
        ;;

    # ── PARTE 3: API y Frontend ──────────────────────────────
    7)
        title "Verificando datos de la API"
        echo -e "  ${BOLD}GET /pokemon:${NC}"
        curl -s "$API_NEST/pokemon"
        echo ""
        echo ""
        echo -e "  ${BOLD}GET /peliculas:${NC}"
        curl -s "$API_NEST/peliculas"
        echo ""
        echo ""
        ok "Frontend HTML disponible en: $API_NEST"
        curl -s -o /dev/null -w "  Estado HTTP: %{http_code}\n" "$API_NEST"
        ;;

    8)
        title "Verificando replicación PostgreSQL activa"
        info "Consultando pg_stat_replication en el PRIMARY..."
        kubectl exec -n $NAMESPACE statefull-nestapi-postgres-0 -- \
            su - postgres -c "psql -c 'SELECT client_addr, state, sync_state, sent_lsn, write_lsn FROM pg_stat_replication;'"
        echo ""
        ok "La REPLICA (pod-1) aparece conectada y sincronizada en tiempo real"
        ;;

    # ── PARTE 4: Alta Disponibilidad ────────────────────────
    9)
        title "HA TEST: Eliminar pod de NestAPI (Deployment)"
        info "Los Deployments garantizan siempre el número de réplicas configurado."
        info "Al eliminar un pod, el Deployment crea uno nuevo automáticamente."
        echo ""
        POD=$(kubectl get pod -l app=nestapi -n $NAMESPACE -o name | head -1)
        echo -e "  Pod eliminado: ${RED}$POD${NC}"
        echo ""
        info "API ANTES de eliminar el pod:"
        curl -s -o /dev/null -w "  HTTP %{http_code} — " "$API_NEST/pokemon"
        echo "$(curl -s "$API_NEST/pokemon" | wc -c) bytes"
        echo ""
        kubectl delete $POD -n $NAMESPACE
        sleep 3
        info "API DESPUÉS (otros pods siguen activos):"
        curl -s -o /dev/null -w "  HTTP %{http_code} — " "$API_NEST/pokemon"
        echo "$(curl -s "$API_NEST/pokemon" | wc -c) bytes"
        echo ""
        kubectl get pods -n $NAMESPACE
        ;;

    10)
        title "HA TEST: Eliminar PRIMARY PostgreSQL (pod-0)"
        info "El service -rw enruta a pod-1 (hot standby) cuando pod-0 no está Ready."
        info "La API debe seguir respondiendo SIN interrupciones."
        echo ""
        echo -e "  ${BOLD}Estado ANTES de la prueba:${NC}"
        kubectl get pods -n $NAMESPACE
        echo ""
        info "API ANTES:"
        curl -s -o /dev/null -w "  HTTP %{http_code}\n" "$API_NEST/pokemon"
        echo ""
        echo -e "  ${YELLOW}⚠  Prepara el navegador con $API_NEST/pokemon en pantalla paralela.${NC}"
        echo -ne "  ${CYAN}[Presiona ENTER para eliminar pod-0 y comenzar la prueba...]${NC}"
        read
        echo -e "  ${RED}Eliminando statefull-nestapi-postgres-0...${NC}"
        kubectl delete pod statefull-nestapi-postgres-0 -n $NAMESPACE
        sleep 3
        info "API INMEDIATAMENTE DESPUÉS (pod-1 sirviendo):"
        curl -s -o /dev/null -w "  HTTP %{http_code}\n" "$API_NEST/pokemon"
        echo ""
        echo -e "  ${BOLD}Estado DESPUÉS:${NC}"
        kubectl get pods -n $NAMESPACE
        echo ""
        ok "Pod-0 se recreará automáticamente con los datos del PVC intactos (~60s)"
        ;;

    11)
        title "HA TEST: Eliminar REPLICA PostgreSQL (pod-1)"
        info "Pod-0 (PRIMARY) sigue activo. La API no se ve afectada en ningún momento."
        info "Kubernetes recrea pod-1 que hace pg_basebackup y vuelve sincronizado."
        echo ""
        echo -e "  ${BOLD}Estado ANTES de la prueba:${NC}"
        kubectl get pods -n $NAMESPACE
        echo ""
        info "API ANTES:"
        curl -s -o /dev/null -w "  HTTP %{http_code}\n" "$API_NEST/pokemon"
        echo ""
        echo -e "  ${YELLOW}⚠  Prepara el navegador con $API_NEST/pokemon en pantalla paralela.${NC}"
        echo -ne "  ${CYAN}[Presiona ENTER para eliminar pod-1 y comenzar la prueba...]${NC}"
        read
        echo -e "  ${RED}Eliminando statefull-nestapi-postgres-1...${NC}"
        kubectl delete pod statefull-nestapi-postgres-1 -n $NAMESPACE
        sleep 3
        info "API INMEDIATAMENTE DESPUÉS (pod-0 sigue sin cambios):"
        curl -s -o /dev/null -w "  HTTP %{http_code}\n" "$API_NEST/pokemon"
        echo ""
        echo -e "  ${BOLD}Estado DESPUÉS:${NC}"
        kubectl get pods -n $NAMESPACE
        ok "Pod-1 se recrea y hace pg_basebackup para resincronizarse con pod-0"
        ;;

    0)
        echo -e "\n${PURPLE}  ¡Demo finalizada!${NC}\n"
        exit 0
        ;;

    *)
        echo -e "\n${RED}  Opción no válida.${NC}"
        ;;
    esac
}

# ── Bucle principal ──────────────────────────────────────────
header
while true; do
    menu
    read opcion
    case_demo $opcion
    esperar
    header
done
