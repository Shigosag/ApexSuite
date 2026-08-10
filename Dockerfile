# Stage 1: Build & Dependency Resolution
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm run install:all

COPY . .

# Stage 2: Production Runtime Environment
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Non-root Security Execution
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server/index.js"]
