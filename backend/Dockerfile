# Backend multi-stage Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
# Install only prod deps after pruning dev ones in builder

FROM base AS deps
# Copy package manifests
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
# (No build step needed for pure JS backend)

FROM base AS runtime
USER node
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5001
ENV PORT=5001
CMD ["node", "index.js"]
