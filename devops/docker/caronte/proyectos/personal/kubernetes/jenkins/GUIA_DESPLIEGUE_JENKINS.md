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

---

## CONFIGURACIÓN DE DOMINIO PARA JENKINS EN ARSYS

### 1. Configuración de DNS en Arsys (Subdominio)

Para que el dominio `jenkins.carmenasir.es` sea accesible desde internet, es necesario crear un registro DNS específico (subdominio) en el panel de control de Arsys.

**Pasos realizados:**

1. Acceder al **Panel de Control de Arsys** > **DNS**.
2. Hacer clic en **"+ Añadir entrada DNS"**.
3. Rellenar el formulario con los siguientes datos (asegurándose de no dejar espacios en blanco):
   - **Entrada DNS (Host):** `jenkins.carmenasir.es`
   - **Tipo:** `A`
   - **Valor (IP):** `161.97.152.19`
4. Guardar los cambios.

> **Verificación:** Puedes comprobar si el dominio ya apunta a la IP correcta ejecutando en tu terminal:
>
> ```bash
> nslookup jenkins.carmenasir.es
> ```
>
> Debe devolver `Address: 161.97.152.19`.

---

### 2. Cambios realizados en values.yaml

```yaml
sidecars:
  configAutoReload:
    enabled: false
ingress:
  enabled: true
  ingressClassName: nginx
  hostName: jenkins.carmenasir.es
installPlugins: []
```

---

#### Comandos ejecutados en local (Windows)

```bash
git add devops/docker/caronte/proyectos/personal/kubernetes/jenkins/values.yaml
git commit -m "Configurar Jenkins para usar jenkins.carmenasir.es"
git push
```

---

#### Comandos ejecutados en la VPS

```bash
# En la VPS, dentro de: ~/devops/docker/caronte/proyectos/personal/kubernetes/jenkins
git pull

helm upgrade --install jenkins jenkins/jenkins -n jenkins \
  --set controller.persistence.enabled=false \
  --set controller.persistence.existingClaim="" \
  --set controller.installPlugins=null \
  --set controller.admin.password=admin123 \
  --set controller.sidecars.configAutoReload.enabled=false \
  --set controller.ingress.enabled=true \
  --set controller.ingress.ingressClassName=nginx \
  --set controller.ingress.hostName=jenkins.carmenasir.es

kubectl get pods -n jenkins
kubectl get ingress -A
```

---

#### Eliminación de Ingress antiguos para evitar conflictos

```bash
kubectl delete ingress carmen-ingress -n proyectocarmen
kubectl delete namespace proyectocarmen
```

---

#### Acceso a Jenkins

- URL: http://jenkins.carmenasir.es
- Usuario: `admin`
- Contraseña: `admin123`
- Espera 5–30 min si acabas de cambiar DNS en Arsys.

---

#### Notas

- Se eliminaron los Ingress y el namespace del proyecto antiguo para evitar conflictos de dominio.
- Si quieres que Jenkins responda también en `carmenasir.es` o `www.carmenasir.es`, indícalo y actualizo el bloque para añadir esos hosts al Ingress.

---

## INSTALACIÓN MANUAL DE PLUGINS Y PRIMER ACCESO

Dado que la instalación inicial se realizó con `installPlugins: null` para evitar errores de timeout, es necesario instalar los plugins fundamentales manualmente desde la interfaz web.

### 1. Actualizar la lista de Plugins

Si al entrar en la sección de plugins no aparecen resultados, puede ser necesario forzar la actualización del `Update Center`:

1. Acceder a: `http://jenkins.carmenasir.es/pluginManager/advanced`
2. Ir a la parte inferior, sección **"Dirección para la actualización"** (Update Site), y pulsar el botón **"Enviar"** (Submit).
3. Como visualmente no ocurre nada confirmando la actualización, acceder manualmente a esta URL para forzar la comprobación:
   `http://jenkins.carmenasir.es/pluginManager/checkUpdatesServer`
4. Finalmente, pulsar el botón azul **"Retry using POST"** cuando aparezca la pantalla de aviso.

### 2. Instalar Plugins Esenciales

1. Ir a **Administrar Jenkins** > **Plugins** > **Available plugins**.
2. Buscar, marcar e instalar los siguientes plugins:
   - `Configuration as Code`
   - `Kubernetes`
   - `Pipeline` (o workflow-aggregator)
   - `GitHub`
   - `Git`
3. Pulsar el botón **Install**.
4. Esperar a que termine la instalación. Si el proceso tarda más de 5 minutos o parece quedarse congelado, **recargar la página manualmente** (F5).

### 3. Login y Seguridad

Una vez reiniciado Jenkins tras la instalación de plugins, el sistema activará la seguridad configurada.

- **URL:** http://jenkins.carmenasir.es
- **Usuario:** `admin`
- **Contraseña:** `admin123`

> Si te solicita login, significa que la seguridad está correctamente activada y el usuario administrador fue creado exitosamente por el chart de Helm.

---

## CONFIGURACIÓN DE CREDENCIALES (DOCKER HUB Y GITHUB)

Para que Jenkins pueda construir tus imágenes Docker y subir cambios a GitHub, necesitas configurar tus credenciales.

> **⚠️ ADVERTENCIA:** El archivo `tokens.txt` está en `.gitignore`. **Nunca se sube a GitHub.** Úsalo solo en local.

El archivo de tokens está en:

```
devops/docker/caronte/common/tokens.txt
```

Ábrelo y rellena tus datos reales. Los valores de este proyecto son:

```text
DOCKER_USER=carmen24
DOCKER_TOKEN=dckr_pat_...       ← ver tokens.txt en local
GITHUB_USER=Carmen-SA24
GITHUB_TOKEN=ghp_...            ← ver tokens.txt en local
```

---

### PASO 2 — Obtener el Token de Docker Hub

1. Accede directamente a: [https://app.docker.com/settings/personal-access-tokens/create](https://app.docker.com/settings/personal-access-tokens/create)
   - O navega desde Docker Hub → avatar (arriba a la derecha) → **Account settings** → **Personal access tokens** → **Generate new token**

2. Rellena el formulario con estos valores exactos:
   - **Access token description:** `jenkins-access`
   - **Expiration date:** `None` _(sin caducidad — válido para proyectos de clase)_
   - **Access permissions:** `Read, Write, Delete`

3. Haz clic en **"Generate"**

4. En la pantalla **"Copy access token"** verás **dos elementos** — no los confundas:
   - 🔵 Comando: `docker login -u carmen24` → solo para terminal, **NO es el token**
   - ✅ El token real: empieza por `dckr_pat_...` → **este es el que debes copiar**

   > ⚠️ El token **solo se muestra una vez**. Si cierras la pantalla sin copiarlo, tendrás que generar uno nuevo.

5. Pégalo en `tokens.txt` en la línea `DOCKER_TOKEN=`

---

### PASO 3 — Obtener el Token de GitHub

1. Accede a: [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Haz clic en **"Generate new token (classic)"**
3. Dale un nombre (ej: `jenkins-pipeline`)
4. **Permisos necesarios:**
   - ✅ `repo` — acceso completo a repositorios privados y públicos
   - ✅ `workflow` — si usas GitHub Actions junto a Jenkins
5. Haz clic en **"Generate token"**
6. **Copia el token** y pégalo en `tokens.txt` como `GITHUB_TOKEN=`

---

### PASO 4 — Añadir las Credenciales en Jenkins

Accede a [http://jenkins.carmenasir.es](http://jenkins.carmenasir.es) con admin/admin123.

#### A) Credencial para Docker Hub

1. Ve a: **Panel de Control → Administrar Jenkins → Credentials**
2. Haz clic en **(global)** bajo "Domains"
3. Haz clic en **"Add Credentials"**
4. Rellena el formulario:
   - **Kind:** `Username with password`
   - **Scope:** `Global`
   - **Username:** el valor de `DOCKER_USER` del `tokens.txt`
   - **Password:** el valor de `DOCKER_TOKEN` del `tokens.txt`
   - **ID:** `dockerhub-credentials` ← **Importante, no cambiar este ID**
   - **Description:** `Credenciales Docker Hub`
5. Haz clic en **"Create"**

#### B) Credencial para GitHub

1. En la misma pantalla, haz clic de nuevo en **"Add Credentials"**
2. Rellena el formulario:
   - **Kind:** `Username with password`
   - **Scope:** `Global`
   - **Username:** el valor de `GITHUB_USER` del `tokens.txt`
   - **Password:** el valor de `GITHUB_TOKEN` del `tokens.txt`
   - **ID:** `github-credentials` ← **Importante, no cambiar este ID**
   - **Description:** `Credenciales GitHub (Token PAT)`
3. Haz clic en **"Create"**

---

### Verificación Final

Para confirmar que las credenciales están correctamente configuradas:

1. Ve a **Administrar Jenkins → Credentials → (global)**
2. Debes ver dos entradas:
   - `dockerhub-credentials` — Username with password
   - `github-credentials` — Username with password

Si alguna falta, repite el paso correspondiente.

---

### Resumen de lo realizado

| Servicio   | Usuario       | Token generado                                              | Guardado en         |
| ---------- | ------------- | ----------------------------------------------------------- | ------------------- |
| Docker Hub | `carmen24`    | `dckr_pat_...` (sin expiración, permisos Read/Write/Delete) | `common/tokens.txt` |
| GitHub     | `Carmen-SA24` | `ghp_...` (token classic, permisos repo+workflow)           | `common/tokens.txt` |

> Los tokens **no se registran en esta guía** por seguridad. Consúltalos siempre en `devops/docker/caronte/common/tokens.txt` (solo en local, está en `.gitignore`).

---

> **Nota:** La persistencia está desactivada (`persistence: false`). Si el pod de Jenkins se reinicia, las credenciales añadidas manualmente se perderán y habrá que volver a crearlas siguiendo los pasos anteriores.

---

## CONFIGURACIÓN DEL WEBHOOK EN GITHUB

El webhook permite que GitHub **avise automáticamente a Jenkins** cada vez que se hace un `git push` al repositorio. Así Jenkins sabe cuándo lanzar el pipeline.

### Pasos para añadir el webhook

1. Ir al repositorio en GitHub (ej: `https://github.com/Carmen-SA24/miportfolio_nextjs`)
2. **Settings** → **Webhooks** → **"Add webhook"**
3. Rellenar el formulario:

| Campo                | Valor                                            |
| -------------------- | ------------------------------------------------ |
| **Payload URL**      | `http://jenkins.carmenasir.es/github-webhook/`   |
| **Content type**     | `application/json`                               |
| **Secret**           | _(dejar vacío)_                                  |
| **SSL verification** | `Enable SSL verification` _(no afecta con HTTP)_ |
| **Which events?**    | `Just the push event`                            |
| **Active**           | ✅ marcado                                       |

4. Clic en **"Add webhook"**

> ⚠️ **Importante:** La URL debe terminar en `/github-webhook/` con la barra final. Sin ella, Jenkins no reconocerá la petición.

### Verificación del webhook

1. En la página de Webhooks del repo, haz clic en el webhook recién creado.
2. Ve a la pestaña **"Recent Deliveries"**.
3. Si el ping inicial falló (punto naranja 🟡), haz clic en **"Redeliver"** para reenviar.
4. Si aparece un ✅ verde, la conexión funciona correctamente.

> **Nota:** Si abres `http://jenkins.carmenasir.es/github-webhook/` en el navegador, aparecerá un error "Oops!" — esto es **normal**. El endpoint solo acepta peticiones POST (las que envía GitHub), no GET (las del navegador).

---

## CREACIÓN DEL PIPELINE EN JENKINS

### PASO 1 — Crear el Folder

Los pipelines se organizan dentro de carpetas (Folders) en Jenkins.

1. En la página principal de Jenkins, clic en **"+ Nueva Tarea"**
2. **Nombre:** `caronte`
3. **Tipo:** `Folder`
4. Clic en **OK**
5. En la pantalla de configuración del folder, no cambiar nada → clic en **"Save"**

### PASO 2 — Crear el Pipeline dentro del Folder

1. Dentro del folder `caronte`, clic en **"+ New Item"** o **"Create a job"**
2. **Nombre:** `miportfolio`
3. **Tipo:** `Pipeline`
4. Clic en **OK**

### PASO 3 — Configurar el Pipeline

#### Sección General

- ✅ Marcar **"GitHub project"**
- **Project url:** `https://github.com/Carmen-SA24/miportfolio_nextjs`

#### Sección Triggers

- ✅ Marcar **"GitHub hook trigger for GITScm polling"**

#### Sección Pipeline

| Campo                | Valor                                                   |
| -------------------- | ------------------------------------------------------- |
| **Definition**       | `Pipeline script from SCM`                              |
| **SCM**              | `Git`                                                   |
| **Repository URL**   | `https://github.com/Carmen-SA24/miportfolio_nextjs.git` |
| **Credentials**      | `github-credentials` (Credenciales GitHub)              |
| **Branch Specifier** | `*/master`                                              |
| **Script Path**      | `Jenkinsfile`                                           |

5. Clic en **"Save"**

### Resultado

El pipeline queda organizado así en Jenkins:

```
Jenkins
└── 📁 caronte (Folder)
    └── 🔧 miportfolio (Pipeline)
```

### Flujo completo con el webhook

```
1. Se hace git push al repo miportfolio_nextjs
2. GitHub envía un webhook POST a Jenkins
3. Jenkins clona el repo
4. Jenkins busca el Jenkinsfile en la raíz del repo
5. Ejecuta los pasos definidos en el Jenkinsfile
```

> **Siguiente paso:** Crear el `Jenkinsfile` en la raíz del repositorio `miportfolio_nextjs` con los pasos del pipeline (build, push a Docker Hub, deploy en Kubernetes).

---
