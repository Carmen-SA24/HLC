
# FROM morgadoberruezo/ubbase
FROM morgadoberruezo/ubsecurity

ARG CONTEXTO
ARG PROYECTO

USER root
RUN apt update && apt install -yq --no-install-recommends \
    tree \
    nginx



RUN chown -R www-data /var/www/html
RUN chmod -R 755 /var/www/html

# instalo nginx/apache --> usuario www-data
# el propietario de /var/www/html debe de ser www-data
RUN mkdir -p /var/log/nginx
EXPOSE 80

COPY ./proyectos/base/${PROYECTO}/deploy/config/default.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /root/admin/sweb/nginx
COPY ./dockerfiles/sweb/nginx /root/admin/sweb/nginx
RUN chmod +x /root/admin/sweb/nginx/admin/start.sh
RUN mv /var/www/html/index.nginx-debian.html /var/www/html/index.html
WORKDIR /root/admin/sweb/nginx
ENTRYPOINT ["./admin/start.sh"]