FROM  debian:11

RUN apt update -y && apt install -y nginx \
    && apt install -y openssl

RUN openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 -keyout \
    /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt -subj "/"


COPY ./nginx/conf/default.conf /etc/nginx/conf.d/default.conf

COPY ./game/front /usr/share/nginx/html

CMD [ "nginx", "-g", "daemon off;" ]