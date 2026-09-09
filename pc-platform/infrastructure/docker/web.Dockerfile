# ──────────────────────────────────────────────────────────────
# Web Dockerfile (apps/web — Next.js Storefront)
# ──────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

FROM deps AS development
COPY . .
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "dev"]

FROM deps AS builder
COPY . .
RUN pnpm --filter @pc-platform/types build
RUN pnpm --filter @pc-platform/validation build
RUN pnpm --filter @pc-platform/api-client build
RUN pnpm --filter @pc-platform/web build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
