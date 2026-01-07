# 🚐 Proyecto Autocaravaneando - Docker Caronte

Sistema de contenedores Docker con arquitectura en capas para servicios web, bases de datos, DNS/DHCP, FTP y proyectos React.

## 📋 Tabla de Contenidos

- [Arquitectura](#-arquitectura)
- [Variables de Entorno](#-variables-de-entorno)
- [Despliegue Rápido](#-despliegue-rápido)
- [Servicios Disponibles](#-servicios-disponibles)
- [Testing y Ciberseguridad](#-testing-y-ciberseguridad)
- [Mantenimiento](#-mantenimiento)

---

## 🏗️ Arquitectura

### Concepto de Capas

El proyecto usa **arquitectura en capas** donde cada imagen Docker hereda de la anterior, reutilizando funcionalidad:

```
Capa 1: ubbase (Base)
   ↓ heredan
Capa 2: Especializaciones (ldapbase, ubnginx, ubsecurity...)
   ↓ heredan
Capa 3: Servicios finales (dbbase, ubAutocaravaneando...)
```

**Ventajas:**
- ✅ No repetir código/configuración
- ✅ Actualizaciones centralizadas
- ✅ Builds más rápidos (capas cacheadas)
- ✅ Imágenes modulares y reutilizables

### Jerarquía de Capas

```
1. ubbase (CAPA BASE COMÚN)
   │  → Ubuntu 22.04
   │  → SSH configurado
   │  → Scripts de administración
   │  → Auditoría de ciberseguridad
   │
   ├── 2. ldapbase (AUTENTICACIÓN)
   │   │  → Cliente LDAP
   │   │  → Autenticación centralizada
   │   │
   │   ├── 3. dbbase (BASE DE DATOS)
   │   │   │  → PostgreSQL
   │   │   │  → Conectado a LDAP
   │   │   │
   │   │   └── 4. postgres-admin (SERVICIO FINAL)
   │   │       → pgAdmin 4 GUI
   │   │       → Puerto 5050
   │   │
   │   ├── 3. ftpbase (TRANSFERENCIA)
   │   │   │  → vsftpd
   │   │   │  → Autenticación LDAP
   │   │   │
   │   │   └── 4. ftp-server (SERVICIO FINAL)
   │   │       → Webmin GUI
   │   │       → Puerto 10000
   │   │
   │   └── 3. dnsbase (RED)
   │       → Bind9 DNS
   │       → ISC DHCP
   │
   ├── 2. ubnginx (WEB)
   │   │  → Nginx web server
   │   │  → Puerto 80
   │   │
   │   └── 3. ubAutocaravaneando (PROYECTOS REACT)
   │       → Node.js 18 + npm
   │       → Build automático
   │       → Puertos 3010 (dev), 8810 (prod)
   │
   ├── 2. ubsecurity (SEGURIDAD)
   │   → nmap, fail2ban, lynis
   │   → Herramientas de auditoría
   │
   └── 2. ubpanel (ADMINISTRACIÓN)
       → Cockpit web panel
       → Puerto 9090

SERVICIO INDEPENDIENTE:
dns-dhcp (SERVICIO FINAL)
   → Technitium DNS Server
   → GUI integrada puerto 5380
```

### Cómo Funciona

1. **ubbase** se construye primero (base común para todos)
2. **Capas nivel 2** heredan de ubbase (`FROM crsaubbase`)
3. **Capas nivel 3** heredan de nivel 2 (`FROM crsaldapbase`)
4. **Servicios finales** heredan y añaden GUIs web

**Ejemplo de herencia:**
```dockerfile
# ubbase (nivel 1)
FROM ubuntu
RUN apt install ssh ...

# ldapbase (nivel 2) hereda de ubbase
FROM crsaubbase
RUN apt install ldap ...

# dbbase (nivel 3) hereda de ldapbase
FROM crsaldapbase
RUN apt install postgresql ...

# postgres-admin (servicio final) hereda de dbbase
FROM crsadbbase
RUN apt install pgadmin4 ...
```

Cada capa **añade funcionalidad** sin modificar las anteriores.

### Servicios con GUIs Web

| Servicio       | GUI          | Puerto | Acceso                     |
|----------------|--------------|--------|----------------------------|
| FTP            | Webmin       | 10000  | http://IP_VPS:10000        |
| DNS + DHCP     | Technitium   | 5380   | http://IP_VPS:5380         |
| PostgreSQL     | pgAdmin 4    | 5050   | http://IP_VPS:5050         |
| React Nginx    | -            | 8810   | http://IP_VPS:8810         |
| React Dev      | Node         | 3010   | http://IP_VPS:3010         |
| Panel Central  | Cockpit      | 9090   | http://IP_VPS:9090         |

---

## 🔧 Variables de Entorno

Archivo: `devops/docker/caronte/.env`

```env
# Variables del Proyecto
PROYECTO=Autocaravaneando
FIRMA=carmensalirrosas
INICIALES=crsa

# Seguridad
USUARIO=rosa
PASSWORD=1234

# Puertos
PORT_NODE=3010
PORT_WWW=8810
PORT_FTP_GUI=10000
PORT_DNS_GUI=5380
PORT_PGADMIN=5050

# Red
IP_WEB=172.20.0.3
SUBNET=172.20.0.0/16
```

---

## 🚀 Despliegue Rápido

### En VPS

```bash
# 1. Clonar repositorio
git clone https://github.com/Carmen-SA24/HLC.git
cd HLC

# 2. Dar permisos a scripts
chmod +x deploy_vps.sh check_services.sh stop_services.sh

# 3. Desplegar todo automáticamente
./deploy_vps.sh
```

El script automáticamente:
- Carga variables desde `.env`
- Construye todas las imágenes base
- Construye capas especializadas
- Levanta servicios con docker compose
- Muestra URLs de acceso

### Comandos Manuales

```bash
cd devops/Docker/Caronte

# Construir imágenes base
docker build --build-arg INICIALES=crsa -f dockerfiles/base/ubbase -t crsaubbase .
docker build --build-arg INICIALES=crsa -f dockerfiles/base/ldapbase -t crsaldapbase .
docker build --build-arg INICIALES=crsa -f dockerfiles/base/dbbase -t crsadbbase .

# Levantar servicios
cd proyectos/ftp-server && docker compose up -d
cd ../dns-dhcp && docker compose up -d
cd ../postgres-admin && docker compose up -d
cd ../react-web && docker compose up -d
```

---

## 🌐 Servicios Disponibles

### 1. FTP Server
- **Base:** ftpbase (vsftpd)
- **GUI:** Webmin - Puerto 10000
- **Características:**
  - Gestión usuarios y permisos
  - Configuración FTP vía web
  - Soporte LDAP

### 2. DNS + DHCP
- **Software:** Technitium DNS Server
- **GUI:** Puerto 5380
- **Características:**
  - Servidor DNS completo
  - Servidor DHCP integrado
  - Interfaz web moderna
  - Estadísticas en tiempo real

### 3. PostgreSQL
- **Versión:** PostgreSQL 16
- **GUI:** pgAdmin 4 - Puerto 5050
- **Características:**
  - Administración completa BD
  - Editor de queries
  - Backup/Restore
  - Monitoreo

### 4. React Web
- **Framework:** React + Vite
- **Puertos:**
  - 3010: Desarrollo (npm start)
  - 8810: Producción (nginx)
- **Build automático:** Se genera en `/var/www/html`

### 5. Panel Central
- **Software:** Cockpit
- **Puerto:** 9090
- **Características:**
  - Dashboard unificado
  - Gestión Docker
  - Monitoreo recursos
  - Terminal web

---

## 🧪 Testing y Ciberseguridad

### Scripts de Auditoría

Ubicación: `dockerfiles/base/admin/ciber/`

- `jambload_ciber.sh` - Auditoría de puertos
- `mainCiber.sh` - Script principal

### Verificar Auditoría

```bash
# Conectar al contenedor
docker exec -it <container> bash

# Ver logs de auditoría
cat /root/logs/informe.log

# Ver auditoría de puertos
grep "PORT AUDITORIA" /root/logs/informe.log
```

### Health Checks

```bash
# Verificar todos los servicios
./check_services.sh

# Salida esperada:
# ✅ FTP - OK (puerto 21)
# ✅ FTP GUI (Webmin) - OK (puerto 10000)
# ✅ DNS - OK (puerto 53)
# ✅ DNS/DHCP GUI (Technitium) - OK (puerto 5380)
# ✅ PostgreSQL - OK (puerto 5432)
# ✅ PostgreSQL GUI (pgAdmin) - OK (puerto 5050)
# ✅ React Nginx - OK (puerto 8810)
# ✅ React Dev (Node) - OK (puerto 3010)
```

---

## 🔧 Mantenimiento

### Scripts Disponibles

```bash
# Health check de servicios
./check_services.sh

# Detener todos los servicios
./stop_services.sh

# Dentro de contenedores - mantenimiento completo
docker exec <container> /root/admin/maintenance.sh check     # Health checks
docker exec <container> /root/admin/maintenance.sh monitor   # Recursos
docker exec <container> /root/admin/maintenance.sh cleanup   # Limpieza
docker exec <container> /root/admin/maintenance.sh backup    # Backup
docker exec <container> /root/admin/maintenance.sh all       # Todo
```

### Ver Logs

```bash
# Logs de un servicio
docker logs <nombre_contenedor>

# Logs en tiempo real
docker logs -f <nombre_contenedor>

# Ver contenedores activos
docker ps

# Ver imágenes construidas
docker images | grep crsa
```

### Acceso SSH

```bash
# Conectar a contenedor React
ssh rosa@IP_VPS -p 2222

# Otros servicios (puertos en docker-compose.yml)
ssh rosa@IP_VPS -p <puerto>
```

---

## 📂 Estructura del Proyecto

```
devops/docker/caronte/
├── .env                          # Variables globales
├── README.md                     # Esta documentación
├── deploy_vps.sh                 # Script de despliegue automático
├── check_services.sh             # Verificación de servicios
├── stop_services.sh              # Detener servicios
│
├── common/
│   └── id_ed25519.pub           # Clave SSH pública
│
├── dockerfiles/
│   ├── base/
│   │   ├── ubbase               # Imagen base Ubuntu
│   │   ├── ldapbase             # + LDAP
│   │   ├── dbbase               # + PostgreSQL
│   │   ├── ftpbase              # + vsftpd
│   │   ├── dnsbase              # + Bind9
│   │   ├── ubnginx              # + Nginx
│   │   ├── ubAutocaravaneando   # + Node.js
│   │   ├── ubsecurity           # + Herramientas ciber
│   │   ├── ubpanel              # + Cockpit
│   │   └── admin/
│   │       ├── start.sh
│   │       ├── maintenance.sh
│   │       ├── ciber/
│   │       ├── panel/
│   │       ├── react/
│   │       ├── ssh/
│   │       ├── sudo/
│   │       └── usuarios/
│   │
│   ├── ftp-server/
│   │   ├── Dockerfile
│   │   ├── start.sh
│   │   └── vsftpd.conf
│   │
│   ├── dns-dhcp/
│   │   ├── Dockerfile
│   │   └── start.sh
│   │
│   ├── postgres-admin/
│   │   ├── Dockerfile
│   │   └── start.sh
│   │
│   └── react-web/
│       └── Dockerfile
│
└── proyectos/
    ├── ftp-server/
    │   └── docker-compose.yml
    ├── dns-dhcp/
    │   └── docker-compose.yml
    ├── postgres-admin/
    │   └── docker-compose.yml
    └── react-web/
        ├── docker-compose.yml
        ├── package.json
        ├── vite.config.js
        └── src/
```

---

## 📝 Notas

- Todas las imágenes heredan configuración base de `ubbase`
- Scripts de ciberseguridad se ejecutan automáticamente en background
- Los builds de React se copian a nginx automáticamente
- Cambiar credenciales por defecto en producción
- Para DHCP real, usar `network_mode: host` en dns-dhcp

---

## 👤 Autor

**Carmen Salir Rosas**
- Proyecto: Autocaravaneando
- Iniciales: CRSA
