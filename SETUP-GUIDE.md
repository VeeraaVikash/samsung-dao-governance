# Samsung DAO — Step-by-Step Setup Guide
> For Windows · HP Victus · PostgreSQL 18 · Node.js 20+

---

## BEFORE YOU START — Checklist

Make sure you have these installed:

```
☐ Node.js 20+          → Check: node --version
☐ npm                   → Check: npm --version
☐ PostgreSQL 18         → You have it at C:\Program Files\PostgreSQL\18\bin
☐ Git                   → Check: git --version
```

---

## STEP 1 — Place the project folder

Take the `samsung-dao` folder and place it in your working directory.

```
D:\Profesional\Industry project\SMAOD\PQC VPN\samsung-dao\
```

Or wherever you want. Open a terminal (PowerShell or CMD) and navigate there:

```powershell
cd "D:\Profesional\Industry project\SMAOD\PQC VPN\samsung-dao"
```

---

## STEP 2 — Create the PostgreSQL database

Open a NEW terminal (PowerShell as Admin) and run:

```powershell
# Navigate to PostgreSQL bin
cd "C:\Program Files\PostgreSQL\18\bin"

# Create user (enter your postgres superuser password when asked)
.\psql.exe -U postgres -c "CREATE USER samsung_dao WITH PASSWORD 'prism_dev_2025';"

# Create database
.\psql.exe -U postgres -c "CREATE DATABASE samsung_dao OWNER samsung_dao;"

# Verify it works
.\psql.exe -U samsung_dao -d samsung_dao -c "SELECT 1;"
# Should print: 1
```

If you get a password prompt for `samsung_dao`, the password is: `prism_dev_2025`

### Troubleshooting:
- **"role already exists"** → That's fine, skip
- **"database already exists"** → That's fine, skip
- **"connection refused"** → Make sure PostgreSQL service is running:
  ```powershell
  net start postgresql-x64-18
  ```

---

## STEP 3 — Create the .env file

Go back to your project terminal:

```powershell
cd "D:\Profesional\Industry project\SMAOD\PQC VPN\samsung-dao"
```

Create a file named `.env` (not `.env.example`) in the project root.

**Copy this EXACTLY into the `.env` file:**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/samsung_dao"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="samsung-prism-dao-secret-2025-change-in-production"
HEDERA_NETWORK="testnet"
HEDERA_OPERATOR_ID=""
HEDERA_OPERATOR_KEY=""
NODE_ENV="development"
```

> **Note:** Leave HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY empty for now.
> The app will still work — wallet binding runs in "MVP mode" without on-chain verification.
> You can add real Hedera credentials later (Step 8).

---

## STEP 4 — Install dependencies

```powershell
npm install
```

This will take 1-2 minutes. You should see no red errors at the end.

### If you get errors:
- **"node-gyp" errors** → Run: `npm install --ignore-scripts` then `npm install` again
- **"ERESOLVE" conflicts** → Run: `npm install --legacy-peer-deps`

---

## STEP 5 — Generate Prisma client + push schema to database

```powershell
# Generate the Prisma TypeScript client
npx prisma generate
```

Expected output: `✔ Generated Prisma Client`

```powershell
# Push the schema to your PostgreSQL database (creates all 13 tables)
npx prisma db push
```

Expected output:
```
🚀 Your database is now in sync with your Prisma schema.
```

### Verify tables were created:
```powershell
npx prisma studio
```
This opens http://localhost:5555 in your browser. You should see 13 tables listed (users, elections, proposals, etc.). All empty for now. Close Prisma Studio (Ctrl+C).

---

## STEP 6 — Seed the database with demo data

```powershell
npx tsx prisma/seed.ts
```

Expected output:
```
🌱 Seeding Samsung DAO database...

  ✓ Users created (6 total)
  ✓ Governance rules (period #7)
  ✓ Election + 3 candidates
  ✓ 3 proposals
  ✓ 2 events (lottery + giveaway)
  ✓ Multisig action (2/3 sigs)
  ✓ 5 contract log entries

✅ Seed complete!

Login credentials (all roles):
  Admin:    SEC-2024-00100 / admin123 (admin), council123 (council), member123 (member)
  Council:  SEC-2024-00201 / admin123 (admin), council123 (council), member123 (member)
  Member:   SEC-2024-00421 / admin123 (admin), council123 (council), member123 (member) (wallet not bound)
  Delegate: SEC-2024-00500 / admin123 (admin), council123 (council), member123 (member)
```

### If `npx tsx` doesn't work:
```powershell
npx ts-node --esm prisma/seed.ts
# OR
node --loader tsx prisma/seed.ts
```

---

## STEP 7 — Start the dev server

```powershell
npm run dev
```

Expected output:
```
  ▲ Next.js 14.2.21
  - Local:   http://localhost:3000
  ✓ Ready in 2.1s
```

**Open http://localhost:3000 in your browser.**

---

## STEP 7b — Test the full flow

### Test 1: Member login with wallet binding
1. Click **"Member login"** on homepage
2. Click **"Continue with Samsung SSO"** (uses demo credentials automatically)
3. You'll see **"Identity confirmed"** — Kim Jae-won, SEC-2024-00421
4. Click **"Continue to wallet setup"**
5. Click **"HashPack wallet"**
6. Enter ANY Hedera testnet account ID (e.g. `0.0.1234567`)
7. Click **"Verify & bind wallet"**
8. You should see **"You're all set"** with the account summary
9. Click **"Go to my dashboard"**
10. You're on the Member Dashboard — try voting for a candidate

### Test 2: Council login
1. Go back to homepage (http://localhost:3000)
2. Click **"Council login"**
3. Click **"Continue with Samsung SSO"**
4. You'll be auto-logged as Park Soo-yeon (council)
5. Dashboard shows governance rules, proposal review queue, election config

### Test 3: Admin login
1. Go back to homepage
2. Click **"Admin login"**
3. Click **"Continue with Samsung SSO"**
4. You'll see the monitor dashboard — anomaly alert, contract logs, member registry
5. Click **"Member registry"** in sidebar to see the user table
6. Click **"Contract logs"** to see the live event feed

### Test 4: Manual login
1. Go to http://localhost:3000/auth/login
2. Enter: `SEC-2024-00421` and `admin123 (admin), council123 (council), member123 (member)`
3. Click **"Sign in"**

---

## STEP 8 (Optional) — Connect real Hedera testnet

This makes wallet binding actually verify accounts on the Hedera testnet.

1. Go to https://portal.hedera.com/
2. Create a free account
3. Go to Dashboard → you'll see your **Account ID** and **Private Key**
4. Edit your `.env` file:
   ```env
   HEDERA_OPERATOR_ID="0.0.XXXXX"
   HEDERA_OPERATOR_KEY="302e020100300506032b6570..."
   ```
5. Restart the dev server (Ctrl+C, then `npm run dev`)
6. Now when members bind wallets, the backend calls Hedera's testnet to verify the account exists

---

## COMMAND CHEATSHEET

```powershell
# Start dev server
npm run dev

# Stop server
Ctrl+C

# Reset database completely (drops all data, re-seeds)
npx prisma migrate reset --force
npx tsx prisma/seed.ts

# View database in browser
npx prisma studio

# Check if database connection works
npx prisma db pull

# Build for production
npm run build
npm start
```

---

## FILE STRUCTURE REFERENCE

```
samsung-dao/
│
├── .env                    ← YOU CREATE THIS (Step 3)
├── .env.example            ← Template
├── .gitignore
├── Dockerfile
├── docker-compose.yml      ← For Docker deployment
├── next.config.js
├── package.json            ← Dependencies (23 packages)
├── postcss.config.js
├── tailwind.config.ts      ← Samsung brand colors
├── tsconfig.json
├── README.md
│
├── prisma/
│   ├── schema.prisma       ← 13 database tables (286 lines)
│   └── seed.ts             ← Demo data (6 users, election, proposals)
│
└── src/
    ├── middleware.ts        ← Route protection (Admin/Council/Member)
    │
    ├── lib/
    │   ├── auth.ts          ← NextAuth config (Samsung SSO simulation)
    │   ├── db.ts            ← Prisma client singleton
    │   └── hedera.ts        ← Hedera SDK (wallet verify + bind)
    │
    ├── types/
    │   └── next-auth.d.ts   ← Session type extensions
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx         ← Samsung blue nav bar
    │   │   ├── StatusBar.tsx      ← Hedera block height
    │   │   ├── Sidebar.tsx        ← Role-specific sidebar
    │   │   └── DashboardLayout.tsx← Shell wrapper
    │   └── ui/
    │       ├── StatCard.tsx       ← Metric card
    │       ├── StatusBadge.tsx    ← Color-coded pill
    │       ├── StepPills.tsx      ← Login progress
    │       ├── AlertBanner.tsx    ← Warning banner
    │       ├── ProposalRow.tsx    ← Proposal list item
    │       └── EventCard.tsx      ← Lottery/giveaway card
    │
    └── app/
        ├── layout.tsx       ← Root HTML layout
        ├── page.tsx         ← Homepage (public)
        ├── providers.tsx    ← SessionProvider
        ├── globals.css      ← Tailwind + custom classes
        │
        ├── auth/
        │   ├── login/page.tsx     ← Step 1: Samsung SSO
        │   ├── verify/page.tsx    ← Step 1b: Identity confirmed
        │   ├── wallet/page.tsx    ← Step 2: Hedera wallet binding
        │   └── success/page.tsx   ← Step 2b: All set
        │
        ├── api/
        │   ├── auth/[...nextauth]/route.ts  ← NextAuth handler
        │   ├── elections/route.ts  ← GET list + POST vote
        │   ├── events/route.ts     ← GET list + POST enter
        │   ├── governance/route.ts  ← GET rules + PATCH update
        │   ├── health/route.ts     ← DB + Hedera status
        │   ├── logs/route.ts       ← Contract event logs
        │   ├── multisig/route.ts   ← GET actions + POST sign
        │   ├── proposals/route.ts  ← CRUD proposals
        │   ├── users/route.ts      ← Profile + registry
        │   └── wallet/route.ts     ← GET status + POST bind
        │
        └── (dashboard)/
            ├── layout.tsx
            ├── member/
            │   ├── dashboard/page.tsx   ← Stats, election, reputation
            │   ├── vote/page.tsx        ← Voting booth
            │   ├── proposals/page.tsx   ← List + create
            │   ├── profile/page.tsx     ← Profile + wallet
            │   ├── lottery/page.tsx     ← Lottery entry
            │   ├── giveaway/page.tsx    ← Giveaway register
            │   └── delegations/page.tsx ← Delegation management
            ├── council/
            │   ├── dashboard/page.tsx   ← Rules, config, proposals
            │   └── proposals/page.tsx   ← Review + approve/reject
            └── admin/
                ├── dashboard/page.tsx   ← Monitor, alerts, multisig
                ├── members/page.tsx     ← Member registry table
                └── logs/page.tsx        ← Contract event log
```

---

## TROUBLESHOOTING

### "Module not found" errors on npm run dev
→ Run `npm install` again, then `npx prisma generate`

### "Can't reach database server"
→ Make sure PostgreSQL is running:
```powershell
net start postgresql-x64-18
```
→ Check your .env DATABASE_URL is correct

### "prisma generate" fails
→ Make sure prisma/schema.prisma exists
→ Run: `npm install @prisma/client prisma`

### Page loads but shows blank white
→ Check browser console (F12) for errors
→ Most likely a missing .env variable

### "NEXTAUTH_SECRET" error
→ Make sure .env has NEXTAUTH_SECRET set (any random string works)

### Port 3000 already in use
→ Kill the process: `npx kill-port 3000`
→ Or use: `npm run dev -- -p 3001`

---

## QUICK SUMMARY — The 6 commands

```powershell
# Run these in order, one by one:

npm install                    # 1. Install packages (~2 min)
npx prisma generate           # 2. Generate DB client
npx prisma db push            # 3. Create tables in PostgreSQL
npx tsx prisma/seed.ts         # 4. Seed demo data
npm run dev                    # 5. Start server
# Open http://localhost:3000   # 6. Done!
```
