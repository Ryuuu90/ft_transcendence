FROM node:18

WORKDIR /usr/src/app/front/

COPY ./package.json .
COPY package-lock.json .

RUN npm install
RUN npm install --save three
RUN npm install --save-dev vite

CMD ["npx", "vite", "--host"]
