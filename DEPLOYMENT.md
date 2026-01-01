# Railway Deployment Guide for Ms Kitchen

This guide will walk you through deploying your Ms Kitchen application to Railway and setting up a PostgreSQL database.

## Prerequisites

- A GitHub account (you already have this: https://github.com/sanjayxseth/mskitchen)
- A Railway account (sign up at https://railway.app)

## Step 1: Sign Up / Sign In to Railway

1. Go to https://railway.app
2. Click "Start a New Project" or "Login"
3. Sign in with your GitHub account (recommended for easy integration)

## Step 2: Create a New Project

1. Once logged in, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `sanjayxseth/mskitchen`
4. Railway will automatically detect it's a Node.js project

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. **Important**: Note the database connection details (you'll need these)

## Step 4: Configure Environment Variables

1. In your Railway project, click on your **service** (the web service, not the database)
2. Go to the **"Variables"** tab
3. Add the following environment variables:

   - `DATABASE_URL` - This will be automatically set by Railway when you link the database
   - `PORT` - Railway sets this automatically, but you can add it manually: `3000`
   - `NODE_ENV` - Set to `production`

4. To link the database to your service:
   - Click on your **web service**
   - Click **"+ New"** → **"Database"**
   - Select your PostgreSQL database
   - Railway will automatically add `DATABASE_URL` to your environment variables

## Step 5: Set Up Database Schema and Seed Data

Railway provides a way to run setup scripts. You have two options:

### Option A: Using Railway's Deploy Script (Recommended)

1. In your Railway project, go to your **web service**
2. Go to **"Settings"** → **"Deploy"**
3. Add a **"Build Command"**: `npm install`
4. Add a **"Start Command"**: `npm start`

5. To run migrations and seed data, you can:
   - Use Railway's **"Deploy Hooks"** or
   - Add a script that runs on startup (see Option B)

### Option B: Modify server.js to Auto-Migrate (Quick Setup)

We can modify `server.js` to automatically run migrations and seed on first startup. This is convenient for initial setup.

**Note**: After the first deployment, you may want to remove this auto-migration feature.

## Step 6: Deploy

1. Railway will automatically deploy when you push to your GitHub repository
2. Or you can trigger a manual deploy:
   - Go to your service
   - Click **"Deploy"** → **"Redeploy"**

## Step 7: Run Database Migrations and Seed

After your first deployment, you need to run the database setup:

### Using Railway CLI (Recommended)

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link your project:
   ```bash
   railway link
   ```

4. Run migrations:
   ```bash
   railway run npm run db:migrate
   ```

5. Seed the database:
   ```bash
   railway run npm run db:seed
   ```

### Alternative: Using Railway's Web Console

1. Go to your service in Railway dashboard
2. Click on **"Deployments"** tab
3. Click on the latest deployment
4. Use the **"Shell"** or **"Logs"** to run commands

Or use Railway's **"One-Click Deploy"** with a custom script.

## Step 8: Access Your Application

1. Once deployed, Railway will provide you with a URL
2. Go to your service → **"Settings"** → **"Generate Domain"**
3. Your app will be available at: `https://your-app-name.up.railway.app`
4. Test the API:
   - Health check: `https://your-app-name.up.railway.app/health`
   - Get recipes: `https://your-app-name.up.railway.app/api/recipes`

## Step 9: Verify Database Connection

1. Visit your Railway project dashboard
2. Click on your **PostgreSQL database**
3. Go to **"Data"** tab to view your tables
4. You should see the `recipes` table with seeded data

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is set in your service variables
- Check that the database service is running
- Ensure the database is linked to your web service

### Migration/Seed Issues

- Check Railway logs: Service → **"Deployments"** → **"View Logs"**
- Verify database connection string format
- Make sure migrations run before the app starts

### Port Issues

- Railway automatically sets the `PORT` environment variable
- Your app should use `process.env.PORT` (which it does)

## Next Steps

- Set up custom domain (optional)
- Configure CI/CD for automatic deployments
- Add more features to your application
- Set up monitoring and logging

## Useful Railway Commands

```bash
# View logs
railway logs

# Run commands in Railway environment
railway run <command>

# Open shell in Railway environment
railway shell
```

## API Endpoints

Once deployed, your API will have these endpoints:

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

---

**Need Help?** Check Railway's documentation: https://docs.railway.app

