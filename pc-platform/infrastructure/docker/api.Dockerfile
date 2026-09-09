# ──────────────────────────────────────────────────────────────
# API Dockerfile (apps/api — NestJS)
# Multi-stage: development → builder → production
# ──────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

# ── Dependencies ───────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# ── Development ────────────────────────────────────────────────
FROM deps AS development
COPY . .
WORKDIR /app/apps/api
CMD ["pnpm", "dev"]

# ── Builder ────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN pnpm --filter @pc-platform/types build
RUN pnpm --filter @pc-platform/validation build
RUN pnpm --filter @pc-platform/database generate
RUN pnpm --filter @pc-platform/api build

# ── Production ─────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN npm install -g pnpm@9
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/main.js"]
