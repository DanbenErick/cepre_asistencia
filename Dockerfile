FROM node:20

WORKDIR app/

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install pm2 -g

EXPOSE 8004

RUN pm2 index.js --port 8004