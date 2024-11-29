FROM docker.io/oven/bun:latest

ENV PUBLIC_BACKEND=/api

WORKDIR /app
COPY package.json .
COPY bun.lockb .

RUN bun install

COPY . /app

RUN bun run build
