# Deployment to Railway

## Backend

The backend is Dockerized and ready for Railway with automatic PostgreSQL setup.

### Quick Start:

1. **Create a Railway account** at https://railway.app
2. **Create a new project** and select "Deploy from GitHub"
3. **Connect your GitHub repository** (this repo)
4. **Railway will automatically**:
   - Detect the `Dockerfile` and build the backend
   - Read `railway.json` and provision a PostgreSQL 15 plugin
   - Set the `DATABASE_URL` environment variable from the PostgreSQL plugin
5. **Set required environment variables** in Railway dashboard (Variables tab):
   - `JWT_SECRET`: a strong secret string (e.g., `openssl rand -hex 32`)
   - Optional for email notifications:
     - `SMTP_HOST`: SMTP server (e.g., smtp.gmail.com)
     - `SMTP_PORT`: SMTP port (default 587)
     - `SMTP_USER`: SMTP username
     - `SMTP_PASS`: SMTP password
     - `SMTP_FROM`: sender email (default `noreply@pricetracker.local`)

### How it works:
- The `railway.json` file declares a PostgreSQL plugin, which Railway will auto-provision.
- The PostgreSQL plugin provides the `DATABASE_URL` environment variable.
- The backend reads `DATABASE_URL` first, then falls back to `DB_URL` if needed.

### Health Check
Once deployed, you can check the health of the backend at:
```
GET https://your-backend.up.railway.app/health
```
Returns: `{ "status": "ok", "timestamp": "..." }`

## Frontend (Web)

The frontend is a Vite + React + Tailwind app.

### Deploying to Railway (optional)

1. Add a `Dockerfile` for the frontend if desired, or deploy via Railway's Node.js buildpack.
2. Alternatively, deploy to Vercel, Netlify, or any static host.

### Local Development
```
cd frontend
npm install
npm run dev
```

## Mobile App (Expo)

The mobile app is configured to use the environment variable `EXPO_PUBLIC_API_URL` for the backend URL.

### To run locally with your Railway backend:
1. Get your Railway backend URL (e.g., `https://your-backend.up.railway.app`)
2. Set the environment variable when starting Expo:
   ```
   EXPO_PUBLIC_API_URL=https://your-backend.up.railway.app npx expo start
   ```
3. Or, create a `.env` file in the `mobile/` directory:
   ```
   EXPO_PUBLIC_API_URL=https://your-backend.up.railway.app
   ```
   Then run `npx expo start` as usual.

### For production builds (EAS)
When building with EAS, set the `EXPO_PUBLIC_API_URL` in your eas.json or via the EAS dashboard.

---
**Note**: The backend expects a PostgreSQL database. The provided `docker-compose.yml` can be used for local development:
```
docker-compose up -d postgres
```
Then set `DATABASE_URL=postgres://user:pass@localhost:5432/traintracker` (adjust credentials as needed) and run the backend.
