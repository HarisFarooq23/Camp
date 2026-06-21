
## Prerequisites

- **Node.js** 20+ (24 recommended)
- **pnpm** — this repo uses pnpm workspaces
- **Python 3.10+** (optional, for live Instagram scraping)
- **instaloader** — `pip install -r requirements.txt`

## Quick start (local development)

### 1. Install dependencies

```bash
npm install -g pnpm
pnpm install
```

### 2. Install Python scraper (optional but recommended)

```bash
pip install -r requirements.txt
```

For better Instagram rate limits, set optional login env vars:

```bash
# Windows PowerShell
$env:IG_PASSWORD = "your_throwaway_ig_password"

# macOS / Linux
export IG_PASSWORD="your_throwaway_ig_password"
```

Then pass `--login your_username --session-file ig.session` when running `scraper.py` directly.

### 3. Run the app

```bash
npm run dev
```

This starts both services:

| Service | URL | Purpose |
|---------|-----|---------|
| **Web app** (CampusCal) | http://localhost:5173 | Main UI + admin portal |
| **API server** | http://localhost:5000 | Health check + Instagram scraper endpoint |

Open http://localhost:5173 and go to **Admin Portal** (`/admin`) to use **Fetch Events**.

### What “Fetch Events” does

1. **Always loads placeholder events** (mock pending events for GIKI and KrackedDevs) — these stay in the list.
2. **Calls the Instagram scraper** via `POST /api/events/fetch/:campusId` to append real posts from configured SME Instagram accounts.
3. If Python/instaloader is missing or Instagram blocks the request, placeholders still appear and a warning is shown.

### Run scraper manually (CLI)

```bash
python scraper.py --list
python scraper.py giki
python scraper.py giki --days 10 --json
```

## Project structure

```
Campus-Event-Hub/
├── artifacts/campuscal/     # React + Vite frontend (CampusCal)
├── artifacts/api-server/    # Express API (scraper bridge)
├── scraper.py               # Instagram event scraper (Python)
├── requirements.txt         # Python deps (instaloader)
└── package.json             # Root scripts (npm run dev)
```

## Deploy to Vercel (frontend)

The Vite app deploys cleanly to Vercel. The Instagram scraper **does not run inside Vercel serverless** (Python + long-running Instagram requests). Use one of these patterns:

### Option A — Frontend on Vercel, API elsewhere (recommended)

1. Deploy the **API server** to [Railway](https://railway.app), [Render](https://render.com), or any Node host:
   - Root: repo root
   - Start command: `pnpm --filter @workspace/api-server run build && cross-env PORT=5000 pnpm --filter @workspace/api-server run start`
   - Install Python + `pip install -r requirements.txt` on that host
   - Set `PORT=5000`

2. Deploy **CampusCal** to Vercel:
   - Import the GitHub repo
   - **Root Directory:** `artifacts/campuscal`
   - **Build Command:** `cd ../.. && pnpm install && pnpm run build:web`
   - **Output Directory:** `dist/public`
   - **Install Command:** `cd ../.. && pnpm install`

3. In Vercel → **Settings → Environment Variables**, add:

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://your-api-host.example.com` (no trailing slash) |

4. Redeploy. The admin **Fetch Events** button will call your hosted API.

### Option B — Vercel frontend only (placeholders)

Deploy as in step 2 above **without** `VITE_API_URL`. The app works; admin fetch shows placeholder events only (scraper API calls fail gracefully).

### Vercel CLI (optional)

```bash
npm i -g vercel
cd artifacts/campuscal
vercel
```

Follow prompts. Set root directory to `artifacts/campuscal` if importing from monorepo root.

## Environment variables

| Variable | Where | Default | Description |
|----------|-------|---------|-------------|
| `PORT` | dev scripts | `5173` (web), `5000` (api) | Server ports |
| `BASE_PATH` | web build | `/` | Vite base path |
| `VITE_API_URL` | frontend prod | `""` (same origin / proxy) | API base URL on Vercel |
| `VITE_API_PROXY_TARGET` | dev only | `http://localhost:5000` | Vite dev proxy target |
| `IG_PASSWORD` | scraper | — | Optional Instagram login password |
| `REPO_ROOT` | api-server | auto-detected | Path to repo root if cwd differs |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + web app together |
| `pnpm run build` | Typecheck and build all packages |
| `pnpm run build:web` | Build CampusCal frontend only |
| `pnpm --filter @workspace/campuscal run dev` | Frontend only |
| `pnpm --filter @workspace/api-server run dev` | API only |

## Troubleshooting

**`npm run dev` fails on install** — use `pnpm install`, not `npm install` (workspace requirement).

**Scraper returns 503** — ensure Python is on PATH (`python --version`) and run `pip install instaloader`.

**Instagram rate limits** — use `--login` with a throwaway account; see `scraper.py` header comments.

**Port already in use** — change ports in root `package.json` `dev` script.
