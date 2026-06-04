# Subasti

Online auction and marketplace (React). Demo data lives in the browser (mock API in `src/api/`).

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
4. Deploy. You get a URL like `https://subasti-xxx.vercel.app`.

`vercel.json` in the repo already sets rewrites for client-side routes.

### Netlify

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
