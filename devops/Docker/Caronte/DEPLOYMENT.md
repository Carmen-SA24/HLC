# Guia de Despliegue de Servicios

## Estructura de Archivos Creados

```
dockerfiles/base/
├── ldapbase          # Base con cliente LDAP
├── dbbase            # Base con PostgreSQL
├── ftpbase           # Base con vsftpd
└── dnsbase           # Base con Bind9/DHCP

dockerfiles/
├── openldap/
│   ├── Dockerfile
│   └── start.sh
├── postgres-admin/
│   ├── Dockerfile
│   └── start.sh
├── ftp-server/
│   ├── Dockerfile
│   ├── vsftpd.conf
│   └── start.sh
└── dns-dhcp/
    ├── Dockerfile
    └── start.sh

proyectos/
├── openldap/
│   └── docker-compose.yml
├── postgres-admin/
│   └── docker-compose.yml
├── ftp-server/
│   └── docker-compose.yml
└── dns-dhcp/
    └── docker-compose.yml
```

## Orden de Construccion de Imagenes Base

Antes de levantar los servicios, construir las imagenes base en este orden:

```bash
cd devops/docker/caronte

# 1. Construir ldapbase (depende de ubbase)
docker build -f dockerfiles/base/ldapbase -t ldapbase:latest .

# 2. Construir dbbase (depende de ldapbase)
docker build -f dockerfiles/base/dbbase -t dbbase:latest .

# 3. Construir ftpbase (depende de ldapbase)
docker build -f dockerfiles/base/ftpbase -t ftpbase:latest .

# 4. Construir dnsbase (depende de ldapbase)
docker build -f dockerfiles/base/dnsbase -t dnsbase:latest .
```

## Despliegue de Servicios

Levantar servicios en este orden (OpenLDAP primero para autenticacion centralizada):

```bash
# 1. OpenLDAP (debe estar primero)
cd proyectos/openldap
docker compose up -d --build

# 2. PostgreSQL
cd ../postgres-admin
docker compose up -d --build

# 3. FTP Server
cd ../ftp-server
docker compose up -d --build

# 4. DNS/DHCP
cd ../dns-dhcp
docker compose up -d --build
```

## Acceso a GUIs Web

- OpenLDAP: http://localhost:6443 (phpLDAPadmin)
- PostgreSQL: http://localhost:5050 (pgAdmin - admin@admin.com / admin)
- FTP: http://localhost:8080 (FileBrowser - admin / admin)
- DNS/DHCP: http://localhost:5380 (Technitium - admin / admin)

## Acceso SSH a Contenedores

- OpenLDAP: ssh usuario@localhost -p 2223
- PostgreSQL: ssh usuario@localhost -p 2224
- FTP: ssh usuario@localhost -p 2225
- DNS/DHCP: ssh usuario@localhost -p 2226

## Notas Importantes

1. Todos los servicios heredan configuracion de usuarios y SSH de ubbase
2. Las credenciales por defecto deben cambiarse en produccion
3. Para DHCP real en VPS, descomentar network_mode: host en dns-dhcp
4. Los volumenes persisten datos entre reinicios de contenedores
