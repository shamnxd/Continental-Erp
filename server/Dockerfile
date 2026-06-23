# Stage 1: Build TypeScript source code
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Create upload directories inside container
RUN mkdir -p uploads logs

EXPOSE 5000

CMD ["node", "dist/index.js"]
