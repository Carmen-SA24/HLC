# MicroK8s basado en ubbase
ARG INICIALES=crsa
FROM ${INICIALES}ubbase

# Instalar dependencias para MicroK8s
RUN apt-get update && apt-get install -y \
    snapd \
    systemd \
    systemd-sysv \
    && rm -rf /var/lib/apt/lists/*

# Copiar scripts de Kubernetes
RUN mkdir -p /root/admin/base/kubernetes
COPY ./dockerfiles/base/admin/kubernetes/maink8s.sh /root/admin/base/kubernetes/
RUN chmod +x /root/admin/base/kubernetes/maink8s.sh

# Copiar script de inicio personalizado
COPY ./dockerfiles/microk8s/start-k8s.sh /root/admin/base/start.sh
RUN chmod +x /root/admin/base/start.sh

# Puertos para Kubernetes
# 16443: API server
# 10250: kubelet  
# 22: SSH
EXPOSE 16443 10250 22

VOLUME ["/var/snap/microk8s"]

ENTRYPOINT ["./start.sh"]
