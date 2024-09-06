FROM node:20

WORKDIR app/

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install typescript -g

RUN tsc

RUN npm install pm2 -g

EXPOSE 8004