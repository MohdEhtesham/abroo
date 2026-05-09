# Aabroo Admin Web

Desktop-first admin dashboard for Aabroo. Vite + React + TypeScript, talks
to the existing Render backend at `/api/admin/*`.

## First-time setup

### 1. Create the first admin on the backend

```bash
cd ../backend
node src/scripts/createAdmin.js \
  --email=admin@aabroo.com \
  --password='someStrongPassword' \
  --name='Aabroo Admin' \
  --phone=9999999999
```

Re-running with the same email is idempotent — it just promotes the user
to admin and resets the password. **Rotate the password after first
login.**

### 2. Run the admin web app locally

```bash
cd admin-web
npm install
npm run dev
```

Open <http://localhost:5173> and sign in with the admin credentials.

### 3. Build for production

```bash
npm run build
# dist/ is the static bundle; deploy it anywhere static hosting is free
# (Vercel, Netlify, Render Static Site, S3+CloudFront, GitHub Pages).
```

## Deploying to Vercel (free)

1. Push this folder as its own GitHub repo (or include this folder when
   importing the parent monorepo into Vercel and set the root directory
   to `admin-web`).
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add `VITE_API_BASE_URL=https://backenddeploy-e010.onrender.com` if the
   default doesn't match your environment.

## What's inside

| Page         | What it shows                                                        |
|--------------|----------------------------------------------------------------------|
| Dashboard    | KPI cards: users, listings, leads, visits, inquiries, suspended      |
| Users        | Search/filter by role + status, edit role/contact/suspend, delete    |
| Listings     | Search/filter by status + source, edit status, delete                |
| Leads        | Search/filter by status, view details, delete                        |
| Visits       | Search/filter by status + mode, view buyer + owner contacts, delete  |
| Inquiries    | Search/filter by status, view timeline, delete                       |

Every list view supports:
- Free-text search across the resource's text fields
- Click row → detail page
- Pagination (25 per page by default)

Detail views support inline edit + delete with `confirm()` guards.
