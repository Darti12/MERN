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
