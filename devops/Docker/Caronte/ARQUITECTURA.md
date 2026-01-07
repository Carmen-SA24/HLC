# Arquitectura de Capas y Servicios

## Capas Base (heredables):
1. **ubbase** → Ubuntu + SSH + admin scripts
2. **ldapbase** → ubbase + cliente LDAP (autenticación centralizada)
3. **dbbase** → ldapbase + PostgreSQL
4. **ftpbase** → ldapbase + vsftpd
5. **dnsbase** → ldapbase + Bind9 + DHCP

## Capas Especializadas:
6. **ubnginx** → ubbase + Nginx (puerto 80)
7. **ubAutocaravaneando** → ubnginx + Node.js (puerto 3000)
8. **ubsecurity** → ubbase + herramientas de auditoría (nmap, fail2ban, lynis)
9. **ubpanel** → ubbase + Cockpit web (puerto 9090)

## Servicios Modulares con GUIs Web:

### 1. FTP Server
- **Base:** ftpbase
- **Servicio:** vsftpd
- **GUI:** Webmin
- **Puerto GUI:** 10000
- **Acceso:** http://localhost:10000
- **Características:** Gestión completa de usuarios, permisos, configuración FTP

### 2. DNS + DHCP Server
- **Base:** ubbase (independiente)
- **Servicio:** Technitium DNS Server
- **GUI:** Technitium (integrada)
- **Puerto GUI:** 5380
- **Acceso:** http://localhost:5380
- **Características:** Gestión DNS, DHCP, monitoreo de consultas, estadísticas

### 3. PostgreSQL Database
- **Base:** dbbase
- **Servicio:** PostgreSQL 15
- **GUI:** pgAdmin 4
- **Puerto GUI:** 80
- **Acceso:** http://localhost:80
- **Características:** Administración completa BD, queries, backup, monitoreo

### 4. Panel de Administración Central
- **Base:** ubbase
- **Framework:** Cockpit
- **Puerto:** 9090
- **Acceso:** http://localhost:9090
- **Características:** 
  - Dashboard unificado
  - Gestión de contenedores Docker
  - Monitoreo de recursos (CPU, RAM, disco)
  - Enlaces a todas las GUIs de servicios
  - Terminal web integrada

## Resumen de GUIs:

| Servicio       | GUI utilizada    | Puerto | URL de acceso              |
|----------------|------------------|--------|----------------------------|
| FTP            | Webmin           | 10000  | http://localhost:10000     |
| DNS + DHCP     | Technitium       | 5380   | http://localhost:5380      |
| PostgreSQL     | pgAdmin 4        | 80     | http://localhost:80        |
| Panel Central  | Cockpit          | 9090   | http://localhost:9090      |
| React Dev      | Node dev server  | 3000   | http://localhost:3000      |
```bash
# Health checks
/root/admin/maintenance.sh check

# Monitoreo recursos
/root/admin/maintenance.sh monitor

# Limpieza automática
/root/admin/maintenance.sh cleanup

# Backup
/root/admin/maintenance.sh backup

# Todo
/root/admin/maintenance.sh all
```

## Acceso a Interfaces:
- Panel Central: http://localhost:9090
- FTP GUI: http://localhost:10000
- DNS/DHCP GUI: http://localhost:5380
- PostgreSQL GUI: http://localhost:80
- React Dev: http://localhost:3000
