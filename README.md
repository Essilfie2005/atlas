# ATLAS — Pan-African Payment Infrastructure Platform

<div align="center">
  <h3>The Financial Rail for Africa</h3>
  <p>A complete, production-grade payment API platform built for African markets.</p>
</div>

---

## What is ATLAS?

ATLAS is a multi-currency payment infrastructure platform designed for African financial markets. It provides:

- **Payment Intent lifecycle** — create, confirm, and track payments end-to-end
- **Multi-provider routing** — Paystack (Ghana/Nigeria) with adapter support for more
- **Immutable ledger** — double-entry accounting for every money movement
- **Payout engine** — disburse to bank accounts and mobile money wallets
- **Webhook delivery** — signed outbound events with exponential backoff retries
- **Settlement reconciliation** — import provider reports and auto-reconcile with 1bp tolerance
- **Merchant dashboard** — full Next.js dashboard at `localhost:3001`
- **Swagger API docs** — interactive docs at `localhost:3000/docs`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | TypeScript + NestJS 10 (Fastify adapter) |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Idempotency | Redis 7 (ioredis) |
| Message Queue | RabbitMQ 3 (amqplib) |
| Dashboard | Next.js 14 (App Router) + Tailwind CSS |
| Monorepo | pnpm workspaces + Turborepo |
| Containers | Docker Compose |

---

## Prerequisites

1. **Docker Desktop** — [Download here](https://www.docker.com/products/docker-desktop/)
2. **Node.js 20+** — [Download here](https://nodejs.org/)
3. **pnpm 9+** — Already installed. If not: `npm install -g pnpm`

---

## Quick Start

### 1. Install Docker Desktop
Download and install Docker Desktop from https://www.docker.com/products/docker-desktop/

Make sure it's **running** before proceeding (you'll see the whale icon in your system tray).

### 2. Set Up Environment Variables

The API environment file is at `apps/api/.env`. It comes pre-filled with development defaults.

If you have a Paystack account, add your test key:
```
PAYSTACK_SECRET_KEY=sk_test_your_key_here
```

### 3. Start Everything

**Option A — Quick start script (recommended):**
```powershell
.\start.ps1
```

**Option B — Manual steps:**
```powershell
# Start databases and message broker
docker compose up -d

# Wait 5 seconds for services to be ready
Start-Sleep 5

# Push database schema (first run) or migrate (subsequent runs)
pnpm --filter @atlas/db exec prisma db push

# Start the API (hot reload)
pnpm --filter @atlas/api start:dev

# In a separate terminal — start the dashboard
pnpm --filter @atlas/dashboard dev
```

### 4. Access Your Services

| Service | URL |
|---------|-----|
| ATLAS API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/docs |
| Dashboard | http://localhost:3001 |
| Health Check | http://localhost:3000/health |

---

## First Steps After Setup

### 1. Register a Merchant

```bash
curl -X POST http://localhost:3000/v1/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "My Business Ltd",
    "email": "me@mybusiness.com",
    "country": "GH"
  }'
```

### 2. Create an API Key

```bash
curl -X POST http://localhost:3000/v1/auth/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "YOUR_MERCHANT_ID",
    "name": "Test Key",
    "type": "TEST"
  }'
```

> **Important:** Copy the `rawKey` from the response — it's shown only once!

### 3. Sign In to Dashboard

Go to http://localhost:3001 and enter your API key to access the dashboard.

### 4. Create a Payment Intent

```bash
curl -X POST http://localhost:3000/v1/payment-intents \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "GHS",
    "idempotencyKey": "pay-001",
    "description": "Test payment"
  }'
```

---

## Project Structure

```
atlas/
├── apps/
│   ├── api/                    # NestJS API
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/           # API key management
│   │       │   ├── merchants/      # Merchant onboarding
│   │       │   ├── payment-intents/# Payment lifecycle
│   │       │   ├── payouts/        # Disbursements
│   │       │   ├── ledger/         # Immutable ledger
│   │       │   ├── webhooks/       # Event delivery
│   │       │   ├── reconciliation/ # Settlement reconciliation
│   │       │   ├── providers/      # Payment adapter registry
│   │       │   └── health/         # Health checks
│   │       └── common/
│   │           ├── guards/         # API key authentication
│   │           ├── filters/        # Error handling
│   │           └── interceptors/   # Logging, response transform
│   └── dashboard/              # Next.js merchant dashboard
│       └── src/app/
│           ├── login/          # Auth page
│           ├── register/       # Merchant signup
│           └── dashboard/
│               ├── page.tsx        # Overview metrics
│               ├── transactions/   # Payment explorer
│               ├── payouts/        # Payout management
│               ├── webhooks/       # Webhook event log
│               ├── settlements/    # Reconciliation view
│               └── settings/       # Merchant profile
├── packages/
│   ├── db/                     # Prisma schema + client
│   ├── core/                   # Shared types, state machine, utils
│   ├── adapters/               # Abstract payment adapter interface
│   └── adapters-paystack/      # Paystack Ghana adapter
├── docker-compose.yml          # PostgreSQL + Redis + RabbitMQ
└── start.ps1                   # One-click startup script
```

---

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | /v1/auth/api-keys | Create a new API key |
| GET | /v1/auth/api-keys | List all API keys |
| DELETE | /v1/auth/api-keys/:id | Revoke an API key |

### Merchants
| Method | Path | Description |
|--------|------|-------------|
| POST | /v1/merchants | Register a merchant |
| GET | /v1/merchants/me | Get current merchant |
| PATCH | /v1/merchants/me | Update merchant profile |

### Payments
| Method | Path | Description |
|--------|------|-------------|
| POST | /v1/payment-intents | Create payment intent |
| GET | /v1/payment-intents | List payment intents |
| GET | /v1/payment-intents/:id | Get payment intent |
| POST | /v1/payment-intents/:id/confirm | Confirm (charge) |
| POST | /v1/payment-intents/:id/cancel | Cancel intent |

### Payouts
| Method | Path | Description |
|--------|------|-------------|
| POST | /v1/payouts/beneficiaries | Add beneficiary |
| GET | /v1/payouts/beneficiaries | List beneficiaries |
| POST | /v1/payouts | Create payout |
| GET | /v1/payouts | List payouts |
| GET | /v1/payouts/:id | Get payout |

### Webhooks
| Method | Path | Description |
|--------|------|-------------|
| GET | /v1/webhooks/events | List webhook events |
| GET | /v1/webhooks/events/:id | Get event details |
| POST | /v1/webhooks/events/:id/retry | Retry failed event |
| POST | /v1/webhooks/test | Send test event |
| POST | /v1/webhooks/verify | Verify incoming signature |

### Settlements
| Method | Path | Description |
|--------|------|-------------|
| POST | /v1/settlements/import | Import provider settlement |
| GET | /v1/settlements | List settlements |
| GET | /v1/settlements/:id | Get settlement |
| POST | /v1/settlements/:id/reconcile | Run reconciliation |

---

## Engineering Principles

- **All money is BigInt** — stored as integer minor units (e.g., GHS pesewas). Never floats.
- **Ledger is append-only** — `LedgerEntry` records are never updated or deleted.
- **Idempotency by default** — payment operations require an `idempotencyKey` (24h Redis TTL).
- **API keys are hashed** — SHA-256 hashed in DB; raw key shown exactly once on creation.
- **Webhooks are signed** — HMAC-SHA256 with `x-atlas-signature` + `x-atlas-timestamp` headers.
- **Webhook retries** — exponential backoff at 1m, 5m, 30m, 2h, 8h (5 attempts max).

---

## Environment Variables

See `apps/api/.env` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `ATLAS_SIGNING_SECRET` | HMAC signing secret for webhooks |
| `PAYSTACK_SECRET_KEY` | Paystack API key (get from dashboard.paystack.com) |
| `PORT` | API port (default: 3000) |

---

## Built With ❤️ for Africa

ATLAS is designed to be the foundational layer for payments across the African continent — starting with Ghana, growing to all 54 countries.
