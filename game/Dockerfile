FROM node:16


WORKDIR /usr/src/app

COPY ./front/. .

RUN npm install -g live-server 

CMD ["live-server", "--host=0.0.0.0", "--port=3000"]