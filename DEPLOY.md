# Deploying filiphagen.com

## The services already exist

This was already a static-first deployment before the hardening run — the
design document inferred otherwise from `Dockerfile` and `docker-compose.yml`,
which Render never used. Both services are native (non-Docker) and predate this
work:

| Service | Type | ID | URL |
|---|---|---|---|
| `MERN-frontend` | Static site | `srv-cio45al9aq06u3mh5al0` | https://mern-0tft.onrender.com |
| `MERN-backend` | Web service (free, Frankfurt) | `srv-cio6mst9aq06u3n16lp0` | https://mern-backend-sjet.onrender.com |

`www.filiphagen.com` CNAMEs to the static site via Cloudflare. SPA fallback is
already configured — deep links like `/cv` and `/projects/mern` return 200.

**So there is nothing to create.** `render.yaml` records this configuration; it
is not a proposal.

---

## Blocker: Render cannot access the repo

Both services failed to build commit `9076b62` on 2026-08-31:

```
It looks like we don't have access to your repo, but we'll try to clone it anyway.
fatal: could not read Username for 'https://github.com': terminal prompts disabled
==> Unable to clone https://github.com/Darti12/MERN
```

The repository is **private**, and Render's GitHub App no longer has access to
it. This blocks everything: builds fail, and even environment-variable updates
fail with `404 not found: https://api.github.com/repositories/665725523`,
because Render resolves the repo on every write.

**Fix (Dashboard, cannot be done via API or MCP):**

Render Dashboard → account settings → **GitHub** → reconnect, and grant access
to `Darti12/MERN` specifically. If the GitHub App is installed with "only
select repositories", add this repo to the selection. Then retry a deploy on
either service.

Until that is done, both services keep serving their last successful builds —
the static site from 2026-04-02 and the API from 2025-08-03. The live site is
not broken; it is just stale.

---

## Once access is restored

### 1. Set environment variables

**`MERN-frontend`** (static site):

| Var | Value |
|---|---|
| `VITE_API_URL` | `https://mern-backend-sjet.onrender.com` |
| `NODE_VERSION` | `22` |

`VITE_API_URL` is **renamed** from `REACT_APP_API_URL` by the Vite migration.
Leave the old one in place until the first successful Vite build, then delete
it. It is baked in at build time, so changing it needs a rebuild.

**`MERN-backend`** (web service):

| Var | Value | Note |
|---|---|---|
| `STATIC_SITE_URL` | `https://mern-0tft.onrender.com` | **Without this CORS blocks every chat request** |
| `NODE_VERSION` | `22` | Node 18 is end-of-life; the build tooling requires ≥20.19 |
| `CHAT_DAILY_TOKEN_CEILING` | `300000` | Optional. The number that bounds your bill |
| `CHAT_RATE_LIMIT_MAX` | `20` | Optional, per IP per day |

`MONGO_URI` and `ANTHROPIC_API_KEY` are already set. Full list in
`backend/.env.example`.

### 2. Change the backend build command

Currently `npm install`; change to **`npm ci`**. The lockfile is now in sync,
and `npm ci` installs exactly what was tested rather than silently resolving
newer versions at deploy time.

### 3. Push and watch

```bash
git push origin main
```

Watch the GitHub Actions run and both Render deploys.

---

## Verifying

```bash
curl https://mern-backend-sjet.onrender.com/health
# {"status":"ok","db":"connected"}
```

`db` may read `connecting` right after a deploy — that is fine. `/health`
reports liveness and always returns 200 while the process is up, so a database
blip cannot fail the deploy; the connection retries with exponential backoff.

Then load the site with the API asleep. The portfolio must render instantly;
only `/chat` should show a warming notice.

## Verifying a deploy is actually the one you think

Render does a rolling deploy: the old instance keeps serving until the new one
is healthy, so **`/health` returning 200 does not mean your new code is live**
— the old instance answers it identically. During the overlap, consecutive
requests can land on either instance and give contradictory answers.

Confirm the deploy reached `status: "live"` before testing behaviour, and if
something looks impossible (a rate-limit header above its own configured
limit, say), suspect the overlap before suspecting the code.

The same applies to static-site deploys, for a different reason: an
env-var-only change can be republished from cache in ~30 seconds without a
rebuild. Check the asset filenames actually changed, or trigger a deploy with
the build cache cleared.

## Failure modes

**Chat returns 503** — the spend ceiling **fails closed**: it refuses rather
than spending money it cannot account for
([ADR 0002, amendment 2](docs/architecture/adr/0002-chat-abuse-guard.md)).
Means the database is unreachable; check `MONGO_URI` and Atlas network access.

**Chat returns 429** — different thing entirely: the daily budget is genuinely
spent, or one IP hit the rate limit. Clears at midnight UTC.

**Chat fails with a CORS error** — `STATIC_SITE_URL` doesn't match the static
site's real origin. Scheme included, no trailing slash.

**Build fails on a Node version error** — `NODE_VERSION` wasn't set. These
services were created in 2023 and may default to a Node older than Vite 8
requires.

## Rolling back

The two services deploy and roll back independently in Render. The portfolio
staying up while the API is broken is a property of the architecture, not an
accident — use it.

## Unused files

`Dockerfile` and `docker-compose.yml` are **not used by Render** — both
services are native runtimes. They were the source of the design run's wrong
inference about how this deploys. Keep them only if you want a local container
workflow; otherwise they are misleading and worth deleting.
