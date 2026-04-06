# Samsung DAO Governance Platform

> Samsung PRISM · Layers 1 & 2 · Hedera Testnet

Enterprise decentralised governance platform for Samsung employees. Built with Next.js 14, PostgreSQL, Prisma ORM, and Hedera SDK for real testnet wallet binding and verification.

---

## Quick Start

### Prerequisites

- **Node.js 20+** and npm
- **PostgreSQL 16+** running locally (or use Docker)
- **Hedera testnet account** (free at [portal.hedera.com](https://portal.hedera.com/))

### Option A — Docker (recommended)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — add your HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY

# 2. Start PostgreSQL + app
docker compose up -d db        # Start database first
npm install                    # Install dependencies
npx prisma generate            # Generate Prisma client
npx prisma db push             # Create tables
npx tsx prisma/seed.ts          # Seed with demo data
npm run dev                    # Start dev server

# Open http://localhost:3000
```

### Option B — Full Docker

```bash
cp .env.example .env
# Edit .env with Hedera credentials
docker compose up --build
# Open http://localhost:3000
```

### Option C — Local PostgreSQL

```bash
# 1. Create database
psql -U postgres -c "CREATE USER samsung_dao WITH PASSWORD 'prism_dev_2025';"
psql -U postgres -c "CREATE DATABASE samsung_dao OWNER samsung_dao;"

# 2. Setup project
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

---

## Login Credentials (Seed Data)

| Role | Employee ID | Password | Wallet |
|------|-------------|----------|--------|
| **Admin** | `SEC-ADMIN-001    | admin123` | N/A (monitor only) |
| **Council** | `SEC-COUNCIL-001  | council123` | Pre-bound: `0.0.4827100` |
| **Member (Proposer)** | `SEC-2024-00421   | member123  | Wallet bound flow |
| **Member (Delegate)** | `SEC-2024-00500   | member123` | Pre-bound: `0.0.4827500` |

To test the full wallet binding flow, log in as **SEC-2024-00421**. You'll be prompted to connect a Hedera testnet wallet. Enter any valid testnet account ID — the backend verifies it against Hedera's mirror node.

---

## Hedera Testnet Setup

1. Go to [portal.hedera.com](https://portal.hedera.com/) and create a free testnet account
2. Copy your **Account ID** (e.g. `0.0.XXXXX`) and **DER-encoded private key**
3. Add to `.env`:
   ```
   HEDERA_OPERATOR_ID=0.0.XXXXX
   HEDERA_OPERATOR_KEY=302e020100300506032b6570...
   ```
4. The platform verifies wallet accounts against the live testnet mirror node
5. If no operator credentials are set, wallet binding runs in "MVP mode" (binds without on-chain verification)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1 — Samsung Member Web Portal (YOUR TEAM)        │
│  Next.js 14 · App Router · Tailwind · shadcn/ui         │
│                                                         │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐               │
│  │ Homepage │ │ Auth Flow│ │ Dashboards │               │
│  │ (public) │ │ (4 steps)│ │ (3 roles)  │               │
│  └─────────┘ └──────────┘ └────────────┘               │
├─────────────────────────────────────────────────────────┤
│  Layer 2 — Identity & Access (YOUR TEAM)                │
│                                                         │
│  NextAuth.js (Samsung SSO simulation)                   │
│  ├── Credentials provider (employee ID + password)      │
│  ├── JWT sessions with role-based claims                │
│  └── Middleware-enforced route protection                │
│                                                         │
│  Hedera SDK (@hashgraph/sdk)                            │
│  ├── AccountInfoQuery — verify account on testnet       │
│  ├── Mirror node API — block height for status bar      │
│  └── Wallet binding — one-time account association      │
│                                                         │
│  PostgreSQL + Prisma ORM                                │
│  ├── Users (6 seed records, 3 roles)                    │
│  ├── Elections, Candidates, Votes                       │
│  ├── Proposals (draft → approved pipeline)              │
│  ├── Governance Rules (period-based)                    │
│  ├── Events (lottery + giveaway)                        │
│  ├── Multisig Actions + Signatures                      │
│  └── Contract Logs (simulated on-chain events)          │
├─────────────────────────────────────────────────────────┤
│  Layers 3–6 — Other Team (mocked with seed data)        │
│  API Gateway · Smart Contracts · Security · Hedera      │
└─────────────────────────────────────────────────────────┘
```

---

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/health` | Public | DB + Hedera status check |
| `POST` | `/api/auth/[...nextauth]` | Public | NextAuth login/session |
| `GET` | `/api/users` | Auth | Current user profile |
| `GET` | `/api/users?mode=registry` | Admin | Full member registry + stats |
| `GET` | `/api/proposals` | Auth | List all proposals |
| `POST` | `/api/proposals` | Member/Council | Create new proposal |
| `PATCH` | `/api/proposals` | Council | Approve/reject proposal |
| `GET` | `/api/elections` | Auth | List elections + candidates |
| `POST` | `/api/elections` | Member | Cast vote |
| `GET/POST` | `/api/wallet` | Auth | Wallet status / bind wallet |
| `GET` | `/api/governance` | Auth | Active governance rules |
| `PATCH` | `/api/governance` | Council | Update governance rules |
| `GET/POST` | `/api/events` | Auth | List events / enter lottery/giveaway |
| `GET/POST` | `/api/multisig` | Auth/Council | Multisig actions / sign |
| `GET` | `/api/logs` | Admin | Contract event log |

---

## Pages & Routing

```
/                         Homepage (public — 3 role cards)
/auth/login               Step 1 — Samsung SSO
/auth/verify              Step 1b — Identity confirmed
/auth/wallet              Step 2 — Hedera wallet binding
/auth/success             Setup complete

/member/dashboard         Member dashboard (stats, election, proposals)
/member/vote              Voting booth
/member/proposals         Proposals list + create
/member/profile           Profile + wallet status
/member/lottery           Lottery entry
/member/giveaway          Giveaway registration
/member/delegations       Delegation management

/council/dashboard        Council dashboard (rules, config, proposals)
/council/proposals        Proposal review + approve/reject

/admin/dashboard          Admin monitor (pipeline, logs, multisig)
/admin/members            Member registry table
/admin/logs               Contract event log (live feed)
```

---

## Database Schema (Prisma)

**13 tables**: `users`, `sessions`, `governance_rules`, `proposals`, `elections`, `candidates`, `votes`, `delegations`, `governance_events`, `event_entries`, `multisig_actions`, `multisig_signatures`, `contract_logs`

Reset and reseed:
```bash
npx prisma migrate reset --force && npx tsx prisma/seed.ts
```

Inspect with Prisma Studio:
```bash
npx prisma studio   # Opens at http://localhost:5555
```

---

## Design System

- **Primary**: Samsung Blue `#1428A0`
- **Typography**: IBM Plex Sans (UI) + IBM Plex Mono (IDs, badges, labels)
- **Borders**: 0.5px solid `#E2E6F0` (no shadows, no gradients)
- **Cards**: White background, 12px radius
- **Nav**: 52px height, Samsung blue
- **Sidebar**: 200px width, white, role-specific sections

---

## Project Structure

```
samsung-dao/
├── docker-compose.yml          # PostgreSQL + app
├── Dockerfile                  # Production build
├── prisma/
│   ├── schema.prisma           # 13-table database schema
│   └── seed.ts                 # Seed data (6 users, election, proposals)
├── src/
│   ├── app/
│   │   ├── page.tsx            # Homepage
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Tailwind + custom utilities
│   │   ├── providers.tsx       # SessionProvider
│   │   ├── auth/               # 4-step login flow
│   │   ├── api/                # 10 API route groups
│   │   └── (dashboard)/        # Route group for authenticated pages
│   │       ├── member/         # 7 member pages
│   │       ├── council/        # 2 council pages
│   │       └── admin/          # 3 admin pages
│   ├── components/
│   │   ├── layout/             # Navbar, StatusBar, Sidebar, DashboardLayout
│   │   └── ui/                 # StatCard, StatusBadge, StepPills, etc.
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config
│   │   ├── db.ts               # Prisma singleton
│   │   └── hedera.ts           # Hedera SDK integration
│   ├── types/
│   │   └── next-auth.d.ts      # Session type extensions
│   └── middleware.ts           # Route protection
├── tailwind.config.ts          # Samsung design tokens
├── tsconfig.json
└── .env.example
```

---

## Key Features

- **Real Hedera testnet integration** — wallet binding verifies account ID via Hedera mirror node
- **PostgreSQL persistence** — all data stored in Postgres via Prisma ORM
- **Role-based access** — NextAuth middleware enforces Admin/Council/Member routing
- **Working APIs** — all 10 route groups return real data from the database
- **Vote casting** — members can vote in live elections with duplicate prevention
- **Proposal pipeline** — create as member, review/approve as council
- **Contract event logging** — every action generates a simulated on-chain log entry
- **Multisig simulation** — 3-of-5 council signature collection

---

*Samsung PRISM · DAO Governance Platform · Layers 1 & 2*
*WorkID: 2SAPP23984*
