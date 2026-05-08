# Deployment to Railway

## Backend

The backend is Dockerized and ready for Railway.

### Steps:

1. **Create a Railway account** at https://railway.app
2. **Create a new project** and select "Deploy from GitHub"
3. **Connect your GitHub repository** (this repo)
4. **Railway will automatically detect the Dockerfile** and build the backend service.
5. **Add a PostgreSQL plugin**:
   - In your Railway project, click on "+" -> "Add Plugin" -> search for "PostgreSQL" and add the official PostgreSQL plugin.
6. **Set environment variables** in the Railway dashboard (Variables tab):
   - `JWT_SECRET`: a strong secret string (e.g., generate with `openssl rand -hex 32`)
   - Optional for email notifications:
     - `SMTP_HOST`
     - `SMTP_PORT` (default 587)
     - `SMTP_USER`
     - `SMTP_PASS`
     - `SMTP_FROM` (defaults to `noreply@pricetracker.local`)
   - Note: The `DATABASE_URL` will be automatically provided by the PostgreSQL plugin. Our backend is configured to read `DATABASE_URL` first, then fall back to `DB_URL`.

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
