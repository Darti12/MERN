# Deploying filiphagen.com

Two services, per [ADR 0001](docs/architecture/adr/0001-static-first-spa.md):

| Service | What | Why |
|---|---|---|
| `filiphagen-web` | The SPA as static files on Render's CDN | No process, so no cold start. The portfolio never waits on the API |
| `filiphagen-api` | Express, scale-to-zero | Only `/chat` needs it, which is the one place a cold start is tolerable |

**Do these in order.** Step 1 must complete before you push, or nothing serves
the frontend: the container and `npm start` now run the API only.

---

## 1. Create the static site (before pushing)

Render dashboard → **New → Static Site**, pointed at this repo.

| Setting | Value |
|---|---|
| Build command | `cd frontend && npm ci && npm run build` |
| Publish directory | `frontend/build` |
| Environment variable | `VITE_API_URL` = the API service's URL (see step 2) |

Then **Redirects/Rewrites**: source `/*`, destination `/index.html`, action
**Rewrite**. Without it, `/cv` and `/projects/mern` 404 on refresh or a direct
link — the routes only exist client-side.

> `VITE_API_URL` is **renamed** from `REACT_APP_API_URL`, and it is baked into
> the bundle at build time. Changing it requires a rebuild, not a restart.

### Using the Blueprint instead

`render.yaml` declares both services. It only applies via **New → Blueprint**;
if your existing services were created by hand, pushing this file changes
nothing. Adopting the Blueprint is optional — the tables here are equivalent.

## 2. Configure the API service

| Setting | Value |
|---|---|
| Build command | `cd backend && npm ci` |
| Start command | `node backend/server.js` |
| Health check path | `/health` |

Environment variables — full list and defaults in `backend/.env.example`:

| Var | Required | Note |
|---|---|---|
| `MONGO_URI` | yes | Atlas connection string |
| `ANTHROPIC_API_KEY` | yes | Server-side only, never in the frontend |
| `STATIC_SITE_URL` | yes | The step-1 site's origin. **Without it CORS blocks every chat request** |
| `CHAT_DAILY_TOKEN_CEILING` | no | Default 300000 (~$4.50/day worst case). This is the number that bounds your bill |
| `CHAT_RATE_LIMIT_MAX` | no | Default 20 requests per IP per day |

Chicken-and-egg: create the API first to learn its URL for `VITE_API_URL`, or
create both and fill each in afterwards, redeploying the static site last.

## 3. Push

```bash
git push origin main
```

This triggers both deploys and the first-ever CI run. Watch all three.

## 4. Move the domain

Only once the static site serves correctly: point `www.filiphagen.com` at
`filiphagen-web`. Give the API its own subdomain (e.g. `api.filiphagen.com`)
and set `VITE_API_URL` to it, then rebuild the static site.

`backend/config/allowedOrigins.js` already permits `filiphagen.com` and
`www.filiphagen.com` alongside `STATIC_SITE_URL`.

---

## Verifying

```bash
curl https://<api>/health
# {"status":"ok","db":"connected"}
```

`db` may read `connecting` right after a deploy — that is fine and by design.
`/health` reports liveness and always returns 200 while the process is up, so
a database blip cannot fail the deploy. It retries the connection with
exponential backoff without needing a redeploy.

Then load the site with the API asleep. The portfolio must render instantly;
only `/chat` should show a warming notice.

## If chat returns 503

The spend ceiling **fails closed**: if it cannot read the usage counter it
refuses rather than spending unverified money
([ADR 0002, amendment 2](docs/architecture/adr/0002-chat-abuse-guard.md)).
A 503 means the database is unreachable — check `MONGO_URI` and Atlas network
access. A **429** is different: that is the daily budget genuinely exhausted,
and it clears at midnight UTC.

## If chat requests fail with a CORS error

`STATIC_SITE_URL` on the API doesn't match the static site's actual origin.
It must include the scheme and no trailing slash.

## Rolling back

The static site and API deploy independently and can be rolled back
independently in Render. The portfolio staying up while the API is broken is a
property of the architecture, not an accident — use it.
