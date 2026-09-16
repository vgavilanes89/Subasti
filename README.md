# Subasti

Online auction and marketplace (React). Most demo data lives in the browser (mock API in `src/api/`); accounts (`api/auth/*.js`) are real, backed by Postgres.

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Preview the production build:

```bash
npm run build
npm run preview
```

## Deploy online (free)

The app is a static React build. Use any host below; all configs send unknown URLs to `index.html` so React Router works.

### Vercel (recommended)

1. Push this folder to GitHub (see below).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Framework preset: **Create React App**. Build: `npm run build`, output: `build`.
4. **Storage tab** → **Create Database** → Postgres (Neon) → connect it to this project. This injects `DATABASE_URL` automatically.
5. Run [sql/001_create_users.sql](sql/001_create_users.sql) against that database once (Storage tab → your database → **Query**, or `psql "$DATABASE_URL" -f sql/001_create_users.sql`) to create the `users` table.
6. In **Settings → Environment Variables**, add for Production and Preview:
   - `VERIFIK_API_KEY` (from [Verifik](https://verifik.co)) — cédula auto-fill on signup (`/api/cedula`).
   - `SESSION_SECRET` — a long random string (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) — signs login sessions (`/api/auth/*`).
7. Deploy. You get a URL like `https://subasti-xxx.vercel.app`.

`vercel.json` in the repo already sets rewrites for client-side routes; `/api/*` serverless functions are routed automatically by Vercel.

### Netlify

Static hosting only — `/api/auth/*` and `/api/cedula` are Vercel serverless functions and won't run here as-is, so login/signup and cédula lookup won't work. Fine for previewing everything else:

1. Push to GitHub.
2. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**.
3. Build command: `npm run build`, publish directory: `build`.
4. Deploy.

`netlify.toml` and `public/_redirects` handle SPA routing.

### First-time Git (if needed)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/subasti.git
git push -u origin main
```

## Demo logins

| Email | Password |
|-------|----------|
| admin@subasti.com | admin |
| ana@subasti.com | 123 |
| carlos@subasti.com | 123 |

## Important limitations

- **Data is not shared online**: users, listings, and carts are stored in memory in the browser. A refresh resets changes unless you add a backend and database.
- **Not for real payments**: checkout is UI-only until you integrate a payment provider.

To go beyond a demo, add a backend API and set `REACT_APP_API_URL` in `.env.production.local` (see `.env.example`).
