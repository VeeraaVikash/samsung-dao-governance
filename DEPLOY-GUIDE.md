# Samsung DAO — Docker & Deployment Guide

---

## OPTION 1: Docker Compose (Local — Everything in Containers)

This runs PostgreSQL + the app together in Docker. No need to install PostgreSQL separately.

### Prerequisites
- **Docker Desktop** installed and running (whale icon in taskbar)
- That's it — Docker handles everything else

### Steps

```powershell
# 1. Open terminal in your project folder
cd "D:\Profesional\Industry project\Samsung prism\Project\samsung-dao"

# 2. Build and start everything (first time takes 2-3 minutes)
docker compose up -d --build

# 3. Wait 10 seconds for PostgreSQL to start, then seed the database
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed.ts

# 4. Open in browser
# http://localhost:3000
```

### Useful Docker Commands

```powershell
# See running containers
docker compose ps

# See app logs (if something breaks)
docker compose logs app

# See database logs
docker compose logs postgres

# Stop everything
docker compose down

# Stop and DELETE all data (fresh start)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build

# Open database viewer
# (run this OUTSIDE Docker, in your normal terminal)
npx prisma studio
```

### How it works
```
┌─────────────────────────────────────────┐
│ Docker                                  │
│                                         │
│  ┌──────────────┐   ┌──────────────┐    │
│  │  postgres     │   │  app         │    │
│  │  Port 5432   │◄──│  Port 3000   │    │
│  │  samsung_dao │   │  Next.js     │    │
│  └──────────────┘   └──────────────┘    │
│                                         │
└─────────────────────────────────────────┘
         ▲                    ▲
         │                    │
    localhost:5432       localhost:3000
    (Prisma Studio)      (Your browser)
```

---

## OPTION 2: Deploy to Live Website (Vercel + Neon — FREE)

This puts your app on a real URL like `samsung-dao.vercel.app`. Cost: **$0**.

### Step 1 — Push code to GitHub

```powershell
# In your project folder
cd "D:\Profesional\Industry project\Samsung prism\Project\samsung-dao"

# Initialize git
git init
git add .
git commit -m "Samsung DAO Governance Platform — PRISM"

# Create a repo on GitHub (https://github.com/new)
# Name it: samsung-dao-governance
# Make it Private
# Don't add README/gitignore (you already have them)

# Connect and push
git remote add origin https://github.com/YOUR_USERNAME/samsung-dao-governance.git
git branch -M main
git push -u origin main
```

### Step 2 — Create free cloud database (Neon)

1. Go to **https://neon.tech** → Sign up (free)
2. Click **"New Project"**
3. Project name: `samsung-dao`
4. Region: Pick closest to you (e.g. Singapore)
5. Click **Create**
6. You'll see a connection string like:
   ```
   postgresql://neondb_owner:abc123@ep-cool-name-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
7. **Copy this string** — you'll need it in Step 3

### Step 3 — Deploy to Vercel

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **"Add New Project"**
3. Select your `samsung-dao-governance` repo
4. **Before clicking Deploy**, click **"Environment Variables"**
5. Add these 4 variables:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `postgresql://neondb_owner:abc123@ep-cool-name-12345...neon.tech/neondb?sslmode=require` (paste your Neon string) |
   | `NEXTAUTH_SECRET` | `samsung-prism-dao-secret-key-min-32-chars` |
   | `NEXT_PUBLIC_HEDERA_NETWORK` | `testnet` |
   | `NEXT_PUBLIC_APP_URL` | `https://your-project-name.vercel.app` |

6. Click **Deploy**
7. Wait 2-3 minutes for the build

### Step 4 — Setup the database on Neon

After Vercel deploys successfully:

```powershell
# In your local project folder, temporarily switch to the Neon database
# Set the environment variable for this terminal session only

$env:DATABASE_URL = "postgresql://neondb_owner:abc123@ep-cool-name-12345...neon.tech/neondb?sslmode=require"

# Push schema to Neon
npx prisma db push

# Seed the data
npx tsx prisma/seed.ts

# Switch back to local DB
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/samsung_dao"
```

### Step 5 — Your app is live!

Open: `https://your-project-name.vercel.app`

Login with:
- **Admin:** `SEC-ADMIN-001` / `admin123`
- **Council:** `SEC-COUNCIL-001` / `council123`
- **Member:** `SEC-2024-00421` / `member123`

### Auto-deploys

Every time you push to GitHub, Vercel automatically rebuilds and deploys:

```powershell
# Make changes, then:
git add .
git commit -m "fix: updated election config"
git push

# Vercel deploys automatically in ~2 minutes
```

---

## OPTION 3: Docker Compose for Production Server

If you have a VPS/server (AWS EC2, DigitalOcean, etc.):

```bash
# On the server
git clone https://github.com/YOUR_USERNAME/samsung-dao-governance.git
cd samsung-dao-governance

# Start everything
docker compose up -d --build

# Seed database
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed.ts

# Your app is running on port 3000
# Point your domain to this server
```

---

## TROUBLESHOOTING

### Docker: "Cannot connect to the Docker daemon"
→ Open Docker Desktop first. Wait for the whale icon to appear in the taskbar.

### Docker: Build fails with "npm ci" error
→ Make sure `.dockerignore` has `node_modules` in it. Delete `node_modules` folder locally and retry.

### Docker: App can't connect to database
→ The app container uses `postgres` as hostname (not `localhost`). This is set in `docker-compose.yml` environment.

### Vercel: Build fails
→ Check Vercel build logs. Most common: missing environment variables. Make sure all 4 are set.

### Vercel: App loads but login fails
→ Database not seeded. Run Step 4 again with the Neon connection string.

### Neon: "too many connections"
→ Free tier allows 5 connections. Close Prisma Studio if open. The app uses 1-2 connections.

---

## COST SUMMARY

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby (free) | $0 |
| Neon Postgres | Free tier (0.5GB) | $0 |
| Hedera Testnet | Always free | $0 |
| GitHub | Free (private repos) | $0 |
| **Total** | | **$0** |
