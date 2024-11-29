FROM docker.io/node

WORKDIR /app
COPY package.json .
COPY bun.lockb .

RUN npm install

COPY . /app

RUN npm run build
