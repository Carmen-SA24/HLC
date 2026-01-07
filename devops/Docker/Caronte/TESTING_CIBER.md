# Guia de Pruebas de Ciberseguridad

## Archivos Creados para Ciberseguridad

```
dockerfiles/base/admin/ciber/
├── jambload_ciber.sh    # Funcion de auditoria de puertos
└── mainCiber.sh         # Script principal de ciberseguridad
```

## Modificaciones Realizadas

1. dockerfiles/base/admin/start.sh

   - Carga mainCiber.sh al inicio
   - Ejecuta load_entrypoint_base antes de SSH
   - Inicia auditoria en background

2. dockerfiles/base/ubbase
   - Permisos de ejecucion para scripts de ciber

## Como Probar que Funciona

### 1. Reconstruir la imagen base

```bash
cd devops/docker/caronte

# Reconstruir ubbase con ciberseguridad
docker build -f dockerfiles/base/ubbase -t ubbase:latest .
```

### 2. Reconstruir y levantar react-web

```bash
cd proyectos/react-web

# Bajar contenedor actual
docker compose down

# Reconstruir con nueva imagen base
docker compose up -d --build
```

### 3. Verificar que la auditoria esta funcionando

```bash
# Conectar por SSH al contenedor
ssh usuario@localhost -p 2222

# Ver logs de auditoria
cat /root/logs/informe.log

# Ver auditoria de puertos (se actualiza cada 30 segundos)
cat /root/logs/\${CONTENEDOR}_ports

# O directamente desde fuera del contenedor
docker exec react-web-container cat /root/logs/informe.log
docker exec react-web-container cat /root/logs/\${CONTENEDOR}_ports
```

### 4. Verificar proceso en background

```bash
# Dentro del contenedor
ps aux | grep jambscan

# Deberia mostrar el proceso ejecutandose
```

### 5. Esperar 30 segundos y verificar actualizacion

```bash
# Ver timestamp del ultimo escaneo
docker exec react-web-container tail -20 /root/logs/\${CONTENEDOR}_ports

# Esperar 30 segundos y volver a ejecutar
# El timestamp deberia cambiar
```

## Que Debe Mostrar la Auditoria

El archivo de log debe contener:

1. Timestamp del escaneo
2. Lista de puertos TCP/UDP abiertos (netstat o ss)
3. Variables de entorno relacionadas con puertos
4. Se actualiza automaticamente cada 30 segundos

## Ejemplo de Salida Esperada

```
=== PORT AUDITORIA ====
Container: ctjambautocaravaneando_ports
Timestamp: Tue Jan 7 11:00:00 UTC 2026

=== Listening TCP/UDP ports ===
tcp   LISTEN  0   511   0.0.0.0:80    0.0.0.0:*
tcp   LISTEN  0   128   0.0.0.0:22    0.0.0.0:*

=== Exposed environment ports ===
PORT_SSH=22
PORT_WWW=80

=== END AUDITORIA ====
```

## Troubleshooting

Si no funciona:

1. Verificar que los scripts tienen permisos de ejecucion
2. Verificar que mainCiber.sh se carga en start.sh
3. Ver logs de inicio: docker logs react-web-container
4. Verificar que el directorio /root/logs existe
