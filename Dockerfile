# Dockerfile for backend
FROM node:20-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY backend/package*.json ./
RUN npm ci --only=production
EXPOSE 3001
CMD ["node", "dist/index.js"]