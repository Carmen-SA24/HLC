# MicroK8s Container

Contenedor MicroK8s basado en **ubbase** siguiendo la arquitectura Caronte existente.

## Errores corregidos en los comandos originales:
1. ✅ `swappoff` → `swapoff`
2. ✅ `sed -i '/ swap /s^/#/'` → `sed -i '/ swap / s/^/#/'`
3. ✅ `--clasic` → `--classic`
4. ✅ `micro8s` → `microk8s`

## Cómo usar

Tienes **dos opciones** para ejecutar MicroK8s:

### Opción 1: Con tu estructura base (RECOMENDADO)
Usa tu sistema de usuarios, SSH y auditoría existente.

```bash
cd devops/docker/caronte/proyectos/microk8s
docker-compose up -d --build
```

La instalación es **automática**. Para verificar:

```bash
# Ver logs de instalación
docker logs -f microk8s_cluster

# Acceder al contenedor
docker exec -it microk8s_cluster bash

# Verificar MicroK8s
source /root/admin/base/kubernetes/maink8s.sh
verify_microk8s
```

### Opción 2: Instalación manual
Si prefieres controlar el proceso:

```bash
# 1. Acceder al contenedor
docker exec -it microk8s_cluster bash

# 2. Ejecutar instalación manual
/root/install.sh

# 3. Verificar
/root/verify.sh
```

## Comandos útiles

### Ver estado de MicroK8s:
```bash
docker exec -it microk8s_cluster microk8s status
```

### Ver todos los pods:
```bash
docker exec -it microk8s_cluster microk8s kubectl get pods -A
```

### Ver nodos:
```bash
docker exec -it microk8s_cluster microk8s kubectl get nodes
```

### Acceder como usuario k8sadmin:
```bash
docker exec -it -u k8sadmin microk8s_cluster bash
```

### Ver logs del contenedor:
```bash
docker-compose logs -f
```

### Detener el contenedor:
```bash
docker-compose down
```

### Detener y eliminar volúmenes:
```bash
docker-compose down -v
```

## Verificación completa

Ejecuta estos comandos para verificar que todo funciona:

```bash
# 1. Ver estado general
docker exec -it microk8s_cluster microk8s status

# 2. Ver pods del sistema
docker exec -it microk8s_cluster microk8s kubectl get pods -A

# 3. Ver servicios
docker exec -it microk8s_cluster microk8s kubectl get services -A

# 4. Crear un pod de prueba
docker exec -it microk8s_cluster microk8s kubectl run nginx --image=nginx

# 5. Ver el pod creado
docker exec -it microk8s_cluster microk8s kubectl get pods

# 6. Eliminar el pod de prueba
docker exec -it microk8s_cluster microk8s kubectl delete pod nginx
```

## Puertos expuestos

- **16443**: Kubernetes API Server
- **10250**: Kubelet API
- **2228**: SSH

## Volúmenes

- `microk8s-data`: Datos persistentes de MicroK8s en `/var/snap/microk8s`

## Addons habilitados

- **dns**: CoreDNS para resolución de nombres
- **ingress**: NGINX Ingress Controller
- **storage**: Storage provisioner
- **metrics-server**: Métricas de recursos

## Troubleshooting

### El contenedor no inicia:
```bash
docker logs microk8s_cluster
```

### MicroK8s no responde:
```bash
docker exec -it microk8s_cluster microk8s inspect
```

### Reiniciar MicroK8s:
```bash
docker exec -it microk8s_cluster microk8s stop
docker exec -it microk8s_cluster microk8s start
```
