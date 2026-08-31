# filiphagen.com

Personal portfolio site with a Claude-backed chatbot that answers questions
about Filip.

It began as a MERN learning project and still uses that stack, but it is no
longer a template: the private half (JWT auth, user accounts, a workouts CRUD,
an admin area) was removed in [ADR 0005](docs/architecture/adr/0005-remove-private-app.md).
What remains is a portfolio and one chat endpoint.

## Shape

```
Visitor ──► Portfolio SPA (static, CDN)          no backend, no cold start
                │
                └── /chat only ──► Express API ──► Anthropic Messages API
                                        └───────► MongoDB Atlas (transcripts)
```

The portfolio renders entirely from bundled i18n JSON and a hardcoded project
list — it makes no API calls at all, which is why it can be served as static
files and never waits on a sleeping backend. Only the chat page talks to the
API. This is enforced, not just intended: a CI check fails the build if any
non-chat route reaches the API.

Full reasoning is in [`docs/architecture/`](docs/architecture/README.md) —
arc42 document, five ADRs, and `model.json` as the source of truth.

## Running locally

**Prerequisites:** Node 22 (Node 18 is end-of-life; the build tooling requires ≥20.19), and a MongoDB (Atlas free tier, or local `mongod`).

```bash
npm run setup                      # install root, frontend and backend deps

cp backend/.env.example backend/.env      # then fill in MONGO_URI and ANTHROPIC_API_KEY
cp frontend/.env.example frontend/.env    # VITE_API_URL=http://localhost:4000

npm run dev                        # API (nodemon) + Vite dev server together
```

Or separately: `npm run dev-backend` / `npm run dev-frontend`.

`npm start` runs the **API alone** — it is the production entry point, and the
frontend is served by a separate static host in production.

## Tests and checks

```bash
cd backend && npm test             # Jest + supertest + in-memory Mongo

npm run build-frontend             # tsc --noEmit && vite build
node scripts/check-frontend-secrets.js            # no secrets in the bundle
node scripts/check-bundle-size.js                 # initial JS under the gzip ceiling
node scripts/check-portfolio-api-independence.js  # no non-chat route calls the API
```

The three scripts are **fitness functions**: automated checks that fail the
build when an architectural property erodes. They run in CI on every push
along with the backend suite and a route-exposure allowlist test. See
[section 11](docs/architecture/README.md) of the architecture document for
what each one protects and why.

## The chat endpoint

`/api/chat` is deliberately **unauthenticated** — a portfolio chatbot behind a
login is useless. Since identity is unavailable as an abuse control, it is
protected by an ordered guard instead, all of it before any billable call:

```
request body size cap → per-IP rate limit → daily token ceiling → Anthropic
```

The daily ceiling (`CHAT_DAILY_TOKEN_CEILING`) is what bounds the bill, and it
**fails closed**: if the usage counter can't be read, the request is refused
rather than spent. The trade — a database outage disables chat — is deliberate
and recorded in [ADR 0002](docs/architecture/adr/0002-chat-abuse-guard.md).

## Deploying

See [DEPLOY.md](DEPLOY.md). Short version: a static site and an API service on
Render, created in that order, with `VITE_API_URL` and `STATIC_SITE_URL`
pointing at each other.

## Stack

**Frontend** — React 18, TypeScript 5, Vite, MUI, Redux Toolkit + RTK Query,
react-router, react-hook-form + yup, i18next (English and Norwegian).

**Backend** — Node 22, Express 5, Mongoose, `@anthropic-ai/sdk`,
express-rate-limit. Jest, supertest and mongodb-memory-server for tests.
