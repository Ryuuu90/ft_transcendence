FROM node:18

WORKDIR /usr/src/app/

COPY ./package.json .

RUN npm install

CMD ["npx", "vite", "--host", "0.0.0.0"]
