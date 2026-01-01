# CLI-Friendly Deployment Options

Here are the simplest options for deploying your app + database via CLI:

## 🚀 Option 1: Fly.io (Recommended - Best CLI)

**Why**: Excellent CLI, can deploy app + PostgreSQL in one command, free tier available.

### Setup:

1. **Install Fly CLI**:
   ```powershell
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Launch your app** (creates everything):
   ```bash
   fly launch
   ```
   - Follow prompts
   - It will detect Node.js
   - Choose to create a PostgreSQL database when prompted
   - Or create separately: `fly postgres create`

4. **Attach database** (if created separately):
   ```bash
   fly postgres attach --app your-app-name
   ```

5. **Set secrets** (if needed):
   ```bash
   fly secrets set DATABASE_URL="your-connection-string"
   ```

6. **Deploy**:
   ```bash
   fly deploy
   ```

7. **Seed database via API**:
   ```bash
   curl -X POST https://your-app.fly.dev/api/seed
   ```

**Pros**: 
- ✅ One CLI for everything
- ✅ Free tier (3 shared VMs)
- ✅ PostgreSQL included
- ✅ Great documentation

---

## 🎯 Option 2: Supabase (Easiest Database + Hosting)

**Why**: Free PostgreSQL + CLI, can deploy edge functions, very simple.

### Setup:

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login**:
   ```bash
   supabase login
   ```

3. **Create project**:
   ```bash
   supabase projects create ms-kitchen
   ```

4. **Get connection string**:
   ```bash
   supabase projects list
   supabase db connection-string --project-ref your-project-ref
   ```

5. **Deploy app** (use Vercel/Render for hosting):
   - Vercel: `vercel --prod`
   - Render: Use web dashboard (CLI coming soon)

6. **Or use Supabase Edge Functions** (for serverless):
   ```bash
   supabase functions deploy your-function
   ```

**Pros**:
- ✅ Free PostgreSQL (500MB)
- ✅ Great CLI
- ✅ Auto-scaling
- ✅ Built-in auth (bonus)

---

## ⚡ Option 3: Neon (Serverless Postgres) + Vercel

**Why**: Best serverless PostgreSQL, Vercel has great CLI.

### Setup:

1. **Install Neon CLI**:
   ```bash
   npm install -g neonctl
   ```

2. **Login**:
   ```bash
   neonctl auth
   ```

3. **Create database**:
   ```bash
   neonctl projects create ms-kitchen
   neonctl branches create --project-id your-project-id
   ```

4. **Get connection string**:
   ```bash
   neonctl connection-string --project-id your-project-id
   ```

5. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

6. **Set environment variable in Vercel**:
   ```bash
   vercel env add DATABASE_URL production
   ```

**Pros**:
- ✅ True serverless PostgreSQL
- ✅ Auto-scaling
- ✅ Free tier (0.5GB storage)
- ✅ Great CLI

---

## 🔧 Option 4: Render (CLI Available)

**Why**: Simple, has CLI, free tier.

### Setup:

1. **Install Render CLI**:
   ```bash
   npm install -g render-cli
   ```

2. **Login**:
   ```bash
   render login
   ```

3. **Create service** (via CLI or web):
   ```bash
   render services:create web --name ms-kitchen --repo https://github.com/sanjayxseth/mskitchen
   ```

4. **Create database**:
   ```bash
   render databases:create postgresql --name ms-kitchen-db
   ```

5. **Link database**:
   ```bash
   render services:env:set DATABASE_URL="your-connection-string"
   ```

**Note**: Render CLI is newer, web dashboard might be easier for first setup.

---

## 📊 Comparison

| Platform | CLI Quality | Free Tier | Database | Ease |
|----------|-------------|-----------|----------|------|
| **Fly.io** | ⭐⭐⭐⭐⭐ | ✅ Good | ✅ Included | ⭐⭐⭐⭐⭐ |
| **Supabase** | ⭐⭐⭐⭐ | ✅ Excellent | ✅ Included | ⭐⭐⭐⭐⭐ |
| **Neon + Vercel** | ⭐⭐⭐⭐ | ✅ Good | ✅ Separate | ⭐⭐⭐⭐ |
| **Render** | ⭐⭐⭐ | ✅ Good | ✅ Included | ⭐⭐⭐⭐ |

---

## 🎯 My Recommendation: Fly.io

**Why Fly.io?**
- ✅ Best CLI experience
- ✅ One command deploys everything
- ✅ Free tier is generous
- ✅ PostgreSQL included
- ✅ Great for Node.js apps

### Quick Start with Fly.io:

```bash
# Install
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
fly auth login

# Launch (does everything)
fly launch

# Deploy
fly deploy

# Seed database
curl -X POST https://your-app.fly.dev/api/seed
```

That's it! 🎉

---

**Which one do you want to try?** I can help you set up any of these via CLI.

