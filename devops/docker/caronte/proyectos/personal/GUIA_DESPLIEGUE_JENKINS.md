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

## Solución a problemas de despliegue y acceso (caso real)

> **IMPORTANTE:** Todos los comandos de esta sección debes ejecutarlos en la VPS, dentro de la carpeta `jenkins` del proyecto Kubernetes:
>
> `devops/docker/caronte/proyectos/personal/kubernetes/jenkins`

Si tienes errores con la persistencia, plugins o bloqueos de red, sigue estos pasos para un despliegue funcional y acceso seguro:

### 1. Limpieza del entorno
Elimina cualquier despliegue previo de Jenkins:
```bash
helm uninstall jenkins -n jenkins
```

### 2. Despliegue limpio y funcional
Instala Jenkins desactivando la persistencia y el instalador de plugins:
```bash
helm install jenkins jenkins/jenkins -n jenkins \
  --set controller.persistence.enabled=false \
  --set controller.installPlugins=null \
  --set controller.admin.password=admin123 \
  --set controller.sidecars.configAutoReload.enabled=false
```

### 3. Acceso a Jenkins desde tu equipo local
Si tienes problemas de acceso directo por red/firewall, usa un túnel SSH y port-forward:

#### a) Abre una terminal en tu equipo local (Windows):
```bash
ssh -L 8080:localhost:12345 rosa@161.97.152.19
```

#### b) En la VPS, ejecuta:
```bash
kubectl port-forward svc/jenkins 12345:8080 -n jenkins
```

#### c) Accede a Jenkins desde tu navegador:
```
http://localhost:8080
```
Usuario: `admin`  
Contraseña: `admin123`

---

### Sobre el acceso a Jenkins y el puerto del túnel SSH

Para acceder a Jenkins desde tu equipo local, siempre debes usar el mismo puerto que configures en el túnel SSH. En el ejemplo de la guía:

- El comando:
  ```bash
  ssh -L 8080:localhost:12345 rosa@161.97.152.19
  ```
  hace que Jenkins sea accesible en tu navegador local en `http://localhost:8080`.

- El número `12345` es el puerto interno del túnel, puedes cambiarlo si lo deseas, pero debes usar el mismo en ambos comandos (SSH y port-forward).

- Si quieres usar otro puerto local, por ejemplo 9090, cambia ambos comandos así:
  ```bash
  ssh -L 9090:localhost:12345 rosa@161.97.152.19
  # ...
  kubectl port-forward svc/jenkins 12345:8080 -n jenkins
  ```
  Y accederías a Jenkins en `http://localhost:9090`.

**Resumen:**
- El puerto después de `-L` es el puerto local de tu PC (el que usas en el navegador).
- El puerto después de `localhost:` es el puerto del túnel (debe coincidir en ambos comandos).
- El puerto final (`8080` en port-forward) es el puerto del servicio Jenkins en Kubernetes.

---

Con esto tendrás Jenkins funcionando y accesible, saltando cualquier restricción de red o almacenamiento. Cuando todo funcione, puedes volver a activar la persistencia si lo necesitas.

---

Si necesitas más detalles o tienes algún error, revisa los logs de Jenkins:
```bash
kubectl logs <nombre-del-pod> -n jenkins
```
