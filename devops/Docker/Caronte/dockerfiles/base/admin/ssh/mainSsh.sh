#!/bin/bash

configurar_ssh() {
  echo "--- Configurando SSH en puerto $PORT_SSH ---" >> /root/logs/informe.log

  # 1. Ajustes en sshd_config
  sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
  
  # Usamos el puerto que viene de la variable de entorno
  if [ -n "$PORT_SSH" ]; then
      sed -i 's/#Port.*/Port '$PORT_SSH'/' /etc/ssh/sshd_config
  fi

  # 2. Crear el directorio vital para el servicio (esto está bien aquí)
  mkdir -p /run/sshd

  # 3. Configurar llaves para el usuario
  # ¡IMPORTANTE! Crear la carpeta y asignar permisos CORRECTOS
  mkdir -p /home/${USUARIO}/.ssh
  cat /root/admin/base/common/id_ed25519.pub >> /home/${USUARIO}/.ssh/authorized_keys
  
  # ARREGLO DE PERMISOS: La carpeta debe ser del usuario, no de root
  chown -R ${USUARIO}:${USUARIO} /home/${USUARIO}/.ssh
  chmod 700 /home/${USUARIO}/.ssh
  chmod 600 /home/${USUARIO}/.ssh/authorized_keys

  # --- ELIMINADO: exec /usr/sbin/sshd -D & ---
  # No arrancamos el servicio aquí. Eso lo hace start.sh al final.
}

configurar_sudo() {
    if [ -f /etc/sudoers ]; then
        echo "$USUARIO ALL=(ALL) NOPASSWD: ALL" > "/etc/sudoers.d/$USUARIO"
        chmod 0440 "/etc/sudoers.d/$USUARIO"
    fi
}