# ──────────────────────────────────────────────────────────────
# Compatibility Engine Dockerfile
# ──────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY packages/config/package.json ./packages/config/
COPY services/compatibility-engine/package.json ./services/compatibility-engine/
RUN pnpm install --frozen-lockfile

FROM deps AS development
COPY . .
WORKDIR /app/services/compatibility-engine
EXPOSE 4001
CMD ["pnpm", "dev"]

FROM deps AS builder
COPY . .
RUN pnpm --filter @pc-platform/types build
RUN pnpm --filter @pc-platform/validation build
RUN pnpm --filter @pc-platform/compatibility-engine build

FROM node:20-alpine AS production
RUN npm install -g pnpm@9
WORKDIR /app
COPY --from=builder /app/services/compatibility-engine/dist ./dist
COPY --from=builder /app/services/compatibility-engine/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 4001
CMD ["node", "dist/main.js"]
