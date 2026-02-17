# Guía de despliegue Jenkins personalizado

## Cambios realizados
- Se ha editado el archivo values.yaml en la ruta:
  - devops/docker/caronte/proyectos/personal/kubernetes/jenkins/values.yaml
- Se ha cambiado el hostname de:
  - jenkins.jamorgado.es → jenkins.carmen.es
- Se ha actualizado el campo hosts en tls:
  - jenkins.jamorgado.es → jenkins.carmen.es

## Comandos para el despliegue

### 1. Actualizar dependencias Helm (si es necesario)
```bash
helm dependency update .
```

### 2. Desplegar Jenkins con Helm
```bash
helm upgrade --install jenkins . \
  --namespace jenkins --create-namespace \
  -f values.yaml
```

### 3. Comprobar recursos en Kubernetes
```bash
kubectl get pods -n jenkins
kubectl get svc -n jenkins
kubectl get ingress -n jenkins
```

### 4. Acceder a Jenkins
- Usa el hostname: jenkins.carmen.es
- Si tienes un Ingress y certificado TLS, accede por https.

## Comandos Git para subir los cambios a la VPS

```bash
git add devops/docker/caronte/proyectos/personal/kubernetes/jenkins/values.yaml
git commit -m "Cambio hostname Jenkins a jenkins.carmen.es"
git push
```

## Comprobar en la VPS

1. Haz `git pull` en la VPS para traer los cambios.
2. Repite los comandos de despliegue Helm en la VPS.

---

Si necesitas más detalles o tienes algún error, revisa los logs de Jenkins:
```bash
kubectl logs <nombre-del-pod> -n jenkins
```
