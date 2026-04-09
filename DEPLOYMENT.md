# Attendly Deployment Guide

Deploy Attendly to **Railway** with a managed PostgreSQL database.

---

## Prerequisites

- A [Railway](https://railway.app) account (free tier available)
- [Railway CLI](https://docs.railway.app/guides/cli) installed (optional but recommended)
- Git repository pushed to GitHub

---

## Step 1: Install the Railway CLI (Optional)

```bash
# macOS
brew install railway

# or via npm
npm install -g @railway/cli

# Login
railway login
```

---

## Step 2: Create a New Railway Project

### Option A: Via the Dashboard

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Empty Project"**

### Option B: Via the CLI

```bash
railway init
```

---

## Step 3: Provision a PostgreSQL Database

### Via the Dashboard

1. Inside your project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will provision a PostgreSQL 16 instance automatically
3. Click on the PostgreSQL service to view its connection details
4. Copy the **`DATABASE_URL`** from the **"Connect"** tab (you'll need this in Step 5)

### Via the CLI

```bash
railway add --plugin postgresql
```

---

## Step 4: Deploy the Attendly App

### Via the Dashboard

1. In the same project, click **"+ New"** → **"GitHub Repo"**
2. Select the **Attendly** repository
3. Railway will auto-detect the `Dockerfile` and start building

### Via the CLI

```bash
# Link to your project
railway link

# Deploy
railway up
```

---

## Step 5: Configure Environment Variables

In the Railway dashboard, click on your **app service** (not the database), go to the **"Variables"** tab, and add the following:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Use Railway's variable reference to auto-link to your DB |
| `NEXT_PUBLIC_BASE_URL` | `https://your-app.up.railway.app` | Your Railway public URL (set after first deploy) |
| `ADMIN_PASSWORD` | `your-secure-password` | **Change this!** Used for admin dashboard login |
| `INVITE_PIN` | `your-pin` | PIN guests use to access invitations |
| `PORT` | `3000` | The port the app listens on |
| `NODE_ENV` | `production` | |
| `NEXT_TELEMETRY_DISABLED` | `1` | Optional |

### Linking the Database URL

Railway supports **reference variables**. Instead of hardcoding the database URL:

1. Click **"+ New Variable"**
2. Set the name to `DATABASE_URL`
3. Set the value to `${{Postgres.DATABASE_URL}}`
4. Railway will automatically resolve this to the internal connection string

> **Important:** The database reference variable (`${{Postgres.DATABASE_URL}}`) uses the **internal** network, which is faster and free of egress charges.

---

## Step 6: Configure the Deploy Settings

1. Click on your app service in the dashboard
2. Go to **"Settings"**
3. Under **Build & Deploy**:
   - **Builder**: Dockerfile (should be auto-detected)
   - **Dockerfile Path**: `./Dockerfile`
4. Under **Networking**:
   - Click **"Generate Domain"** to get a public `*.up.railway.app` URL
5. Update `NEXT_PUBLIC_BASE_URL` in your variables to match the generated domain

---

## Step 7: Run Database Migrations

The `entrypoint.sh` in the Docker image automatically runs `prisma migrate deploy` on startup, so migrations will apply automatically when the container starts.

If you need to run migrations manually:

```bash
# Via Railway CLI
railway run npx prisma migrate deploy
```

---

## Step 8: Verify the Deployment

1. Visit your Railway URL (e.g., `https://attendly-production.up.railway.app`)
2. Test the guest PIN entry at the root URL
3. Test admin login at `/login` with your `ADMIN_PASSWORD`
4. Test the health endpoint at `/api/health`

---

## Custom Domain (Optional)

1. In your app service, go to **"Settings"** → **"Networking"**
2. Click **"+ Custom Domain"**
3. Enter your domain (e.g., `attendly.yourdomain.com`)
4. Add the **CNAME record** Railway provides to your DNS settings
5. Wait for DNS propagation (usually a few minutes)
6. Update `NEXT_PUBLIC_BASE_URL` to your custom domain

---

## Monitoring & Logs

### Dashboard
- Click on your app service → **"Logs"** tab to view real-time logs

### CLI
```bash
railway logs
```

---

## Useful Railway CLI Commands

```bash
railway status          # View project status
railway logs            # View app logs
railway variables       # List environment variables
railway run <command>   # Run a command in the Railway environment
railway open            # Open the project dashboard in browser
```

---

## Troubleshooting

### App crashes on startup
- Check that `DATABASE_URL` is set and the Postgres service is running
- View logs for migration errors: **Logs** tab or `railway logs`

### Database connection refused
- Ensure you're using the Railway reference variable (`${{Postgres.DATABASE_URL}}`) for internal networking
- Check that the PostgreSQL service is healthy in the dashboard

### Migrations fail
- Run manually: `railway run npx prisma migrate deploy`
- If the schema is out of sync, you may need: `railway run npx prisma db push`

### QR codes show wrong URL
- Ensure `NEXT_PUBLIC_BASE_URL` matches your actual deployment URL (including `https://`)
- Redeploy after changing this variable (it's baked in at build time)

> **Note**: Since `NEXT_PUBLIC_BASE_URL` is a public env var, it's embedded at **build time**. You must trigger a redeploy after changing it for the new value to take effect.
