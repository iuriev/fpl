FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY web/package*.json ./web/
COPY proxy/package*.json ./proxy/
RUN npm ci
COPY . .
RUN npm run build -w web

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY web/package*.json ./web/
COPY proxy/package*.json ./proxy/
RUN npm ci --omit=dev --workspace=proxy
COPY proxy/src ./proxy/src
COPY --from=builder /app/web/dist ./web/dist
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node_modules/.bin/tsx", "proxy/src/index.ts"]
