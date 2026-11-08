# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN npm install -g pnpm@9

# ── deps stage ────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/db/package.json ./packages/db/
COPY packages/core/package.json ./packages/core/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @atlas/api... 2>/dev/null || pnpm install --filter @atlas/api...

# ── build stage ───────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY turbo.json ./
RUN pnpm --filter @atlas/db... build 2>/dev/null || true
RUN pnpm --filter @atlas/api build

# ── runner stage ──────────────────────────────────────────
FROM node:20-alpine AS runner
RUN npm install -g pnpm@9
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Prisma needs the schema at runtime for migrations
COPY packages/db/prisma ./packages/db/prisma

ENV NODE_ENV=production
EXPOSE 3000

WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
