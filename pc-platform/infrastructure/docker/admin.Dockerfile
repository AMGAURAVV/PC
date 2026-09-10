# ──────────────────────────────────────────────────────────────
# Admin Dockerfile (apps/admin — Next.js Backoffice)
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
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --frozen-lockfile

FROM deps AS development
COPY . .
WORKDIR /app/apps/admin
EXPOSE 3002
CMD ["pnpm", "dev"]

FROM deps AS builder
COPY . .
ENV DOCKER_BUILD=1
RUN pnpm --filter @pc-platform/types build
RUN pnpm --filter @pc-platform/validation build
RUN pnpm --filter @pc-platform/api-client build
RUN pnpm --filter @pc-platform/ui build
RUN pnpm --filter @pc-platform/admin build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./.next/static
COPY --from=builder /app/apps/admin/public ./public

ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002
CMD ["node", "server.js"]
