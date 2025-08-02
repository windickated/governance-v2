FROM node:20

WORKDIR /app

COPY package.json .
COPY bun.lockb . 

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build