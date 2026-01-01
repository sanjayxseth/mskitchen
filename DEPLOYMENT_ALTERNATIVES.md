# Alternative Deployment Options

Since Railway's free plan only supports databases, here are alternatives to deploy your web service:

## Option 1: Deploy App on Render (Free) + Railway Database

### Steps:
1. **Keep your Railway PostgreSQL database** (it's already set up)
2. **Deploy your app on Render** (free tier available):
   - Go to https://render.com
   - Sign up with GitHub
   - Click "New" → "Web Service"
   - Connect your GitHub repo: `sanjayxseth/mskitchen`
   - Settings:
     - Build Command: `npm install`
     - Start Command: `npm start`
   - Add Environment Variable:
     - `DATABASE_URL` = Your Railway PostgreSQL connection string
     - `NODE_ENV` = `production`
   - Click "Create Web Service"
3. **Seed the database** via API once deployed

## Option 2: Deploy on Vercel (Free) + Railway Database

### Steps:
1. **Keep your Railway PostgreSQL database**
2. **Deploy on Vercel**:
   - Go to https://vercel.com
   - Sign up with GitHub
   - Import your repository: `sanjayxseth/mskitchen`
   - Add Environment Variables:
     - `DATABASE_URL` = Your Railway PostgreSQL connection string
   - Deploy
3. **Note**: Vercel is optimized for serverless, but Express apps work too

## Option 3: Deploy on Fly.io (Free) + Railway Database

### Steps:
1. **Keep your Railway PostgreSQL database**
2. **Deploy on Fly.io**:
   - Install Fly CLI: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`
   - Login: `fly auth login`
   - Launch: `fly launch`
   - Set environment variable: `fly secrets set DATABASE_URL="your-railway-connection-string"`

## Option 4: Use Render for Both (Free)

### Steps:
1. **Deploy app on Render** (same as Option 1)
2. **Create PostgreSQL on Render**:
   - In Render dashboard: "New" → "PostgreSQL"
   - Copy the connection string
   - Update your app's `DATABASE_URL` environment variable
3. **Migrate from Railway** (optional):
   - Export data from Railway database
   - Import to Render database

## Option 5: Use Supabase (Free) - Database + Hosting

### Steps:
1. Go to https://supabase.com
2. Create a new project
3. Get your PostgreSQL connection string
4. Deploy your app (can use Vercel/Render) and connect to Supabase

## Recommended: Render + Railway Database

This is the easiest option:
- ✅ Render has a generous free tier for web services
- ✅ Your Railway database is already set up
- ✅ Just need to connect them via `DATABASE_URL`

### Quick Render Setup:

1. Visit: https://dashboard.render.com
2. Sign up/login with GitHub
3. Click "New +" → "Web Service"
4. Connect repository: `sanjayxseth/mskitchen`
5. Configure:
   - **Name**: `ms-kitchen` (or any name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Environment Variables**:
   - `DATABASE_URL` = `postgresql://postgres:WVYVGApjrxrEhwSkudXPOdtGNzDTLSmq@yamanote.proxy.rlwy.net:48796/railway`
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render uses port 10000, but your app should use `process.env.PORT`)
7. Click "Create Web Service"
8. Wait for deployment (takes 2-5 minutes)
9. Once deployed, seed via API: `POST https://your-app.onrender.com/api/seed`

---

**Which option would you like to use?** I recommend Render as it's the simplest and has good free tier support.

