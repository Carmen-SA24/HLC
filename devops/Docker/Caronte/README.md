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

### Capas Base (heredables)

```
1. ubbase → Ubuntu + SSH + admin scripts + ciberseguridad
   ├── 2. ldapbase → + cliente LDAP
   │   ├── 3. dbbase → + PostgreSQL
   │   ├── 3. ftpbase → + vsftpd
   │   └── 3. dnsbase → + Bind9 + DHCP
   │
   ├── 2. ubnginx → + Nginx (puerto 80)
   │   └── 3. ubAutocaravaneando → + Node.js (puerto 3000)
   │
   ├── 2. ubsecurity → + herramientas auditoría (nmap, fail2ban, lynis)
   └── 2. ubpanel → + Cockpit web (puerto 9090)
```

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
