# Zynkra — Setup Guide

How to run the Zynkra project on a fresh machine, from zero to working client + backend.

---

## 1. Prerequisites

| Tool              | Version / Notes                                              |
| ----------------- | ------------------------------------------------------------ |
| Node.js           | **v22** (tested on 22.23.2). Use `nvm use 22` if you have nvm. |
| npm               | Comes with Node.                                              |
| Docker            | Required for Postgres, Redis, and IPFS.                       |
| Docker Compose    | `docker compose` (v2).                                        |
| Build tools       | Needed to compile the `canvas` native module on first install (Python 3, `make`, `g++`, plus `libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev` on Debian/Ubuntu). |

> The `canvas` package is a compiled C++ addon. If the Node version changes, it must be rebuilt (see [section 8](#8-common-issues-and-gotchas)).

---

## 2. Clone

```bash
git clone https://github.com/Podamekalajagadeesh/zynkra.git
cd zynkra
```

The repo has three runnable parts:

- `server/` — NestJS backend (API) on port **3000**
- `client/` — React + Vite frontend on port **5173**
- `mobile/` — not covered here

---

## 3. Infrastructure services (Docker)

The backend needs Postgres and Redis. The avatar upload path needs IPFS.

### Start Postgres + Redis (from `docker-compose.yml`)

```bash
docker compose --env-file server/.env up -d postgres redis
```

> The compose file interpolates `JWT_SECRET` / `SESSION_SECRET`, so point it at the server env file (or export those vars) rather than running it bare.

### Start IPFS (avatar upload)

The compose file does not include IPFS. Run it once:

```bash
docker run -d --name ipfs --restart unless-stopped \
  -p 5001:5001 -p 4001:4001 -p 8080:8080 \
  ipfs/kubo:v0.27.0
```

Verify: `curl -s -X POST -F "file=@-;filename=t.txt" http://localhost:5001/api/v0/add` returns a JSON object with a `Hash`.

> **After a machine/container restart**, the containers stay stopped. Restart them with:
> ```bash
> docker start zynkra-postgres-1 zynkra-redis-1 ipfs
> ```
> (or `docker compose --env-file server/.env up -d postgres redis`).

---

## 4. Environment variables

Never commit real values. Templates exist at `server/.env.example` and `client/.env.example`.

### 4.1 Server — `server/.env`

```bash
cp server/.env.example server/.env
```

Fill in at minimum:

```dotenv
JWT_SECRET=<long random string>
SESSION_SECRET=<long random string>

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=zynkra

NODE_ENV=development
PORT=3000
DB_MIGRATIONS_RUN=true

# Used in emailed links (password reset, verification)
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000

# SMTP — required for the reset/verification emails to actually send
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<app-password>
FROM_EMAIL=<your-email>
```

Optional (features degrade gracefully when unset): `OPENROUTER_API_KEY`, `STRIPE_SECRET_KEY`, `SENTRY_DSN`, Google/GitHub OAuth IDs and secrets, `RECAPTCHA_*`, `GOOGLE_MAPS_API_KEY`, `IPQS_API_KEY`.

> Note: Gmail app passwords contain spaces (e.g. `xxxx nvfs ofvn zzzz`). The server reads `.env` fine, but don't `source` it from a shell — use `docker compose --env-file server/.env` instead.

### 4.2 Client — `client/.env.local`

```bash
cp client/.env.example client/.env.local
```

Recommended values for local development:

```dotenv
VITE_API_URL=/                    # same-origin; the Vite dev server proxies /auth, /users, … to :3000
VITE_WS_URL=ws://localhost:5173   # proxied WebSocket for live events
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_E2EE=true
VITE_ENVIRONMENT=development

# Wallet + RPC — dev placeholders are fine to run the UI; real values needed for wallet features
VITE_WALLETCONNECT_PROJECT_ID=dev-placeholder
VITE_ALCHEMY_API_KEY=dev-placeholder
```

Real values for `VITE_WALLETCONNECT_PROJECT_ID` come from https://cloud.walletconnect.com and for `VITE_ALCHEMY_API_KEY` from https://dashboard.alchemy.com.

---

## 5. Run the backend

```bash
cd server
npm install
npm rebuild canvas      # needed once; recompiles canvas for the current Node version
npm start               # or: npm run start:dev   (watch mode)
```

First boot runs pending migrations automatically (`DB_MIGRATIONS_RUN=true`).

You should see:

```
[Nest] LOG [NestApplication] Nest application successfully started
```

Verify: `curl http://localhost:3000/api/v1/health` → `200`.

---

## 6. Run the frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

Verify: the login page loads and `POST /auth/signin` is **not** intercepted by MSW (it should hit the real backend through the Vite proxy).

---

## 7. Ports

| Port | Service         | Notes                          |
| ---- | --------------- | ------------------------------ |
| 3000 | NestJS backend  | API                            |
| 5173 | Vite dev server | Frontend, proxies `/auth` etc. |
| 5432 | Postgres        | Docker                         |
| 6379 | Redis           | Docker                         |
| 5001 | IPFS HTTP API   | Docker (avatar uploads)        |

---

## 8. Common issues and gotchas

1. **`NODE_MODULE_VERSION` mismatch (canvas)** — native modules are tied to a Node ABI. Fix: `cd server && npm rebuild canvas`.

2. **`ECONNREFUSED` on :5432** — Postgres/Redis are stopped. `docker start zynkra-postgres-1 zynkra-redis-1` (or `docker compose --env-file server/.env up -d postgres redis`).

3. **Profile save `400 Validation failed`** — an empty string in optional fields (e.g. empty `website`) used to trip `@IsUrl`/`@IsEnum`. Fixed by `UpdateUserDto` converting `''` → `undefined`. If it regresses, check the DTO transform.

4. **Avatar save `500` / `fetch failed`** — IPFS isn't running. Start the `ipfs` container (section 3). Stored avatars are bare IPFS CIDs; the UI needs a gateway prefix to render them.

5. **`ERR_NETWORK` / `ERR_NAME_NOT_RESOLVED` on forgot-password** — two historical causes, both fixed:
   - A stale **MSW service worker** intercepting requests. `main.tsx` now unregisters it on startup. If you ever re-enable MSW (for mock testing), unregister `mockServiceWorker.js` in DevTools first.
   - The **double-slash URL** bug: `API_BASE_URL` + `/path` used to produce `//auth/...` (hostname `auth`). `API_BASE_URL` is now normalized to never end in a slash.

6. **MSW must stay disabled in dev** — `client/src/main.tsx` has `enableMocking()` commented out so requests reach the real backend via the Vite proxy. Re-enabling it will make sign-in return mock 400s.

7. **Login `400`** — a username without `@` is sent as `username`, which the old MSW mock rejected. With MSW off, the real backend handles both.

---

## 9. Useful commands

Backend:

```bash
npm run start:dev     # watch mode
npm run build         # compile to dist/
npm run start:prod    # run compiled dist/main
npm run migration:run # run pending migrations
npm run test          # jest
```

Frontend:

```bash
npm run dev           # dev server
npm run build         # typecheck + production build
npm run test          # vitest
```
