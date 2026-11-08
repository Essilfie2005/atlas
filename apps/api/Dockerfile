# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm@9 prisma@5.22.0

# ── deps stage ────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN pnpm install --filter @atlas/api...

# ── build stage ───────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
RUN prisma generate --schema=packages/db/prisma/schema.prisma
RUN pnpm --filter @atlas/api build

# ── runner stage ──────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3000

WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
