# Builder Stage
FROM node:23-alpine AS builder

# Install dependencies required for `node-gyp`
RUN apk add --no-cache python3 make g++

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# copy public files
COPY public ./app/public

# Copy the rest of the application code to the working directory
COPY . .

# Build the Next.js application
RUN npm run build

# Start the Next.js application
CMD ["npm", "start"]
