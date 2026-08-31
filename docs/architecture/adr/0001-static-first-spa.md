# 0001. Use a statically hosted SPA with a separate API

- Status: accepted
- Date: 2026-08-31
- Deciders: Filip
- Drivers: responsiveness, availability, security

## Context

The site is hosted on Render as a single service that runs both the React dev server and the
Express API. Render scales it to zero when idle, so the first visitor after a quiet period
waits for a Node process to wake before seeing anything at all. The frontend has a
`serviceStatus: 'Turning on...'` indicator and a 30-second polling loop built specifically to
paper over this.

The decisive fact is that the portfolio does not need a backend. About, Projects, CV and
Contact render entirely from bundled i18n JSON and a hardcoded list in `Projects.tsx`. The
`/api/projects` endpoint exists, requires authentication, and is called by nobody on the public
site. Only the chat page talks to the API.

So the cold start is being paid on every page, to serve content that is already static.

## Options considered

- **Single service, fixed** — keep one deployable, fix the Dockerfile so it serves the built
  assets instead of the dev server, and optionally pay for always-on.
- **Static SPA on a CDN plus a separate API** — publish the build output to a static host;
  the API keeps serving only `/api/chat`.
- **Static site plus a serverless function** — replace Express with a function per endpoint.

## Decision

Publish the built SPA as static assets to a CDN host (Cloudflare Pages or Render Static Site),
and keep the Express API as a separate Render service serving only the chat path. The SPA
reaches the API by absolute URL for chat and for nothing else.

## Consequences

**Good:** the portfolio loads at CDN speed regardless of API state, which is the actual fix for
the cold-start pain rather than a workaround for it. The portfolio stays up when the API is
down, over budget, or being deployed — which matters for a CV during a job search. The chat
endpoint becomes the only dynamic, attackable surface in the system, shrinking the security
problem to one route. The API can stay scale-to-zero and near-free, because nothing latency-
sensitive depends on it any more.

**Bad:** two deploy targets instead of one. CORS and the API base URL become real configuration
that can be wrong, where previously same-origin made them invisible. Possibly a second vendor.

**Notably not bad:** this is not a distributed system. The SPA has no runtime — it is a bag of
files — so none of the usual costs of splitting a deployable (network failure modes, distributed
data, tracing across processes) apply. That asymmetry is the whole reason this decision is cheap.

**Follow-up:** fitness function f4 asserts that no route other than `/chat` issues an API
request, because the independence bought here is exactly the kind of property that erodes the
first time someone finds it convenient to fetch something on the About page.

## Amendment — 2026-08-31: this was already the deployment

The Context above says the site "is hosted on Render as a single service that
runs both the React dev server and the Express API." That was wrong, and it was
inferred from `Dockerfile` and `docker-compose.yml` — which Render has never
used. Both Render services are native runtimes, and they have been split since
2023:

- `MERN-frontend`, a static site serving `frontend/build` on Render's CDN, with
  `www.filiphagen.com` pointed at it and SPA fallback already configured.
- `MERN-backend`, a Node web service running `node server.js` from `backend/`.

So the decision recorded here did not change the deployment topology. What it
actually did was make the codebase match a topology that already existed: the
API had been serving routes the SPA reached by relative URL assumptions, the
Dockerfile described a single-process deployment nobody ran, and nothing
enforced the portfolio's independence from the API.

The consequences claimed above still hold — the portfolio does not wait on the
API, and chat is the only attackable surface — but they were properties of the
hosting, not gains from this decision. The genuine gains were narrower: the API
base URL became explicit configuration, CORS became real rather than incidental,
and fitness function f4 now enforces the independence that was previously only
true by accident.

The lesson: deployment config in the repo is not evidence of how something
deploys. `Dockerfile` and `docker-compose.yml` were the most confident-looking
artifacts available and both were dead. Checking the actual hosting provider
first would have cost one command.

