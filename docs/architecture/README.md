# filiphagen.com — Architecture

Brownfield design run, **Sketch** tier, 2026-08-31. Purpose: harden an existing live system,
not rebuild it.

> **Status: built.** All ten roadmap slices were implemented and merged on 2026-08-31.
> The design below is the reasoning; `roadmap.md` records the order it was built in, and
> the risk table marks which risks the build actually closed. Two things this document got
> wrong were found during implementation and are recorded as amendments in ADR 0002 and as
> risk r9 — read those before trusting any single claim here.

> This is a *considered* architecture, not a correct one. The scorecard below is an argument;
> the numbers in the scenarios are estimates I proposed. Both are wrong in ways only building
> will reveal — which is why the roadmap is ordered riskiest-first and the fitness functions
> exist.

## 1. Goals

A personal portfolio site with an LLM-backed chatbot that answers questions about Filip. This
run has three targets, taken directly from stated pain:

1. The chat endpoint cannot spend unbounded money.
2. A cold API does not delay the portfolio.
3. Dependency upgrades stop hurting.

## 2. Constraints

| | |
|---|---|
| Team | One developer, part-time, no dedicated ops |
| Budget | Personal. The Anthropic key is real money with no revenue behind it |
| Anonymity | The chatbot must serve visitors who never log in — so identity is unavailable as an abuse control |
| Continuity | www.filiphagen.com keeps working throughout; no flag day |
| Hosting | Render, scale-to-zero |

## 3. Context

Anonymous visitors read portfolio content and may chat. Filip maintains it alone. Three external
systems matter: the Anthropic Messages API (billed per token, critical), MongoDB Atlas (free
tier, not critical), and Render.

## 4. Solution strategy

**The portfolio does not need a backend.** About, Projects, CV and Contact render from bundled
i18n JSON and a hardcoded list in `Projects.tsx`. Only chat calls the API. Once the frontend is
served as static assets from a CDN, the API's cold start stops being every visitor's problem and
becomes only the chatbot's — the one place it is tolerable.

That single move buys responsiveness *and* availability at almost no cost, because the SPA has no
runtime. This is a two-deployable system with none of the usual costs of splitting one, since one
half is a bag of files.

The API itself is hardened, not restructured: it stays a layered Express monolith, with an abuse
guard added in front of the only billable path.

### Style scorecard

Driving characteristics, top 3 weighted double: **security ×2, responsiveness ×2,
maintainability ×2**, affordability, availability, deployability, observability ×1.

| Style | Sec | Resp | Maint | Afford | Avail | Deploy | Obs | **Total** |
|---|---|---|---|---|---|---|---|---|
| **Static-first client/server** ✅ | 5 | 5 | 4 | 5 | 4 | 5 | 3 | **45** |
| Static site + serverless function | 5 | 3 | 3 | 5 | 4 | 5 | 3 | 39 |
| Single-service monolith (status quo, fixed) | 4 | 2 | 4 | 4 | 2 | 4 | 3 | 33 |

**Rejected — single-service monolith:** loses on responsiveness and availability. It couples the
CV's load time to a sleeping Node process, which *is* the cold-start pain. Fixing that by paying
for always-on costs money the static option does not.

**Rejected — serverless:** loses on maintainability. It rewrites the Express layer, which
contradicts a hardening run, adds per-invocation Mongo connection handling, and moves the cold
start onto the chat path rather than removing it.

**Rejected without scoring — microservices, service-based, event-driven:** one developer, two
capabilities, portfolio-scale traffic. Any distribution here is pure cost.

**Partitioning stays technical.** There are two capabilities, not a domain. Slicing by domain at
this size would be ceremony.

## 5. Building blocks

| Container | Kind | Technology | Responsibility |
|---|---|---|---|
| Portfolio SPA | ui | React 18 + TS + MUI, built with Vite, static on CDN | All portfolio content, with no backend dependency. Hosts the chat UI — the only view that calls the API |
| Chat API | service | Node 18 + Express 5 on Render | `/api/chat` and `/health`. Applies the abuse guard before any billable call, then relays to Anthropic and persists the transcript |
| Chat transcripts | store | MongoDB Atlas + TTL index | Anonymous transcripts, expiring after 30 days |
| Anthropic Messages API | external | `claude-opus-5` via `@anthropic-ai/sdk` | Generates replies |

The architecturally significant part of the API is the abuse guard. The CRUD around it is not.

## 6. Runtime

**Portfolio view** — CDN serves the bundle. No API involvement, no cold start, works while the
API is down.

**Chat message** — SPA POSTs to the API → body size cap → per-IP rate limit → global daily token
ceiling → *only then* an Anthropic call → response streamed back and transcript persisted. The
ordering is the design: every control sits before the billable call, never after.

## 7. Deployment

Static host (Cloudflare Pages or Render Static Site) for the SPA. Render web service,
scale-to-zero, for the API. MongoDB Atlas. Anthropic.

## 8. Crosscutting concepts

**Secrets** — `ANTHROPIC_API_KEY` is server-side only and must stay so. Enforced by fitness
function f2, because the Vite migration changes env-var inlining rules and that is exactly when
this breaks.

**Data minimisation** — transcripts are unauthenticated strangers' messages with no lasting
value. A 30-day TTL index makes retention a property of the schema rather than a promise.

**Governance** — five CI checks, listed in §11. All fail the build; none require anyone to look
at a dashboard, which matters for a maintainer with no ops time.

Dependabot (`.github/dependabot.yml`) keeps the tree current so f5 has nothing to catch: minor
and patch updates arrive grouped as one weekly PR per package root, majors as individual PRs
because in this repo they are real migrations. Every PR runs the full pipeline, so a bump that
breaks an architectural invariant fails before merge. f5 detects rot; Dependabot prevents it.

## 9. Decisions

| ADR | Title |
|---|---|
| [0001](adr/0001-static-first-spa.md) | Use a statically hosted SPA with a separate API |
| [0002](adr/0002-chat-abuse-guard.md) | Use a rate limit and spend ceiling instead of authentication to protect the chat endpoint |
| [0003](adr/0003-vite-over-cra.md) | Use Vite in place of Create React App |
| [0004](adr/0004-anthropic-sdk.md) | Use the Anthropic SDK in place of hand-rolled HTTP calls |
| [0005](adr/0005-remove-private-app.md) | Remove the workouts and admin application from the codebase |

## 10. Quality requirements

Driving characteristics, at most seven, top three marked:

**security ★**, **responsiveness ★**, **maintainability ★**, affordability, availability,
deployability, observability.

*Considered and rejected:* scalability and elasticity (portfolio traffic; one small instance is
already oversized), fault tolerance (a chatbot outage is an inconvenience, not an incident), data
integrity (the only stored data is disposable — which is itself the argument for the TTL),
interoperability (nothing integrates with this).

### Scenarios

**S1 — security (H,H) — the one that drives the architecture.**
An anonymous script with no credentials POSTs to `/api/chat` continuously from a handful of IPs,
unattended overnight. Requests beyond a per-IP allowance get 429; requests beyond a global daily
token ceiling are rejected outright. *Measure: worst-case Anthropic spend in any 24h window stays
under a configured cap (assumed $5/day) while a visitor sending up to 20 messages/day never sees
a 429.*

**S2 — responsiveness (H,M).**
A first-time visitor follows a link from a CV while the API has been idle for hours. The
portfolio renders and is fully navigable with no dependency on the API; only the chat page shows
a warming indicator. *Measure: FCP under 1.5s p95 regardless of API state; first chat reply
within 8s p95 including cold start.*

**S3 — maintainability (M,H).**
Filip returns after three months, adds a project and upgrades dependencies from a clean checkout.
*Measure: clean install to green build in under 30 minutes, with no unmaintained build-tool
dependency in the tree.*

### Review — walking S1 through the design

**Satisfied, at a cost.** The guard bounds spend absolutely, and the cost is named in ADR 0002: a
determined abuser can exhaust the daily ceiling and deny the chatbot to genuine visitors for the
rest of the day. We choose availability loss over unbounded cost deliberately. **This is the
sensitivity point of the entire design** — if the chatbot ever becomes load-bearing, that trade
inverts and ADR 0002 needs superseding.

S2 is satisfied structurally by ADR 0001: static assets cannot have a cold start. S3 is satisfied
by ADR 0003, and is the only scenario whose difficulty comes from a migration rather than a
design property.

## 11. Fitness functions

| # | Protects | Check |
|---|---|---|
| f1 | security | N+1 requests from one IP → the last returns 429. With the counter at its ceiling, the next request is rejected and the stubbed Anthropic client records **zero** calls — a guard that rejects after paying is not a guard |
| f2 | security | Built frontend contains no `ANTHROPIC` string and no key-shaped literal |
| f3 | security | Every mounted Express route appears on an explicit public/private allowlist. A new route fails the build until someone declares its exposure |
| f4 | responsiveness | Bundle stays under a gzip ceiling; no route other than `/chat` issues an API request |
| f5 | maintainability | Clean install from lockfile + build + test on every push; `npm audit` gates at high severity |

f3 exists because this entire design run traces back to two lines that got commented out and
nothing noticed.

## 12. Risks

| Risk | Sev × Lik | Mitigation |
|---|---|---|
| **Chat endpoint is unauthenticated and unmetered in production right now** | high × high | Roadmap step 1, before anything else. This is live, not hypothetical |
| `GET /api/chat` throws on every call (`req.user` never set); `/api/chat/:id` returns any stranger's transcript by id | med × high | Delete the listing route; make retrieval require an unguessable token |
| Key leaks into the bundle during the Vite migration | high × low | Fitness function f2 |
| Healthcheck polls a `/health` route that does not exist | med × med | Add the route. Roadmap step 2 |
| Container runs the CRA dev server in production and never serves the build it just made | med × high | Resolved structurally by ADR 0001 |
| CRA → Vite migration breaks something only visible in production | med × med | Migrate *after* the static host exists, so the previous build is an instant rollback |
| Sole maintainer, no ops — anything needing attention won't get it | med × high | Every control here is set-and-forget middleware, an index, or a CI check |
| The only code that runs in production is the only code with no tests | med × high | Redirect the existing test harness at the abuse guard |

## 13. Honest limits

**The weakest part of this design** is the global spend ceiling. It is shared mutable state read
before every call, and it converts a cost attack into an availability attack rather than
eliminating it. It would be wrong if the chatbot mattered more than the bill — which for a
personal site it does not, but that is a judgement, not a fact.

**Every number here is assumed, not given.** The $5/day cap, 20 messages/visitor/day, 1.5s FCP,
8s first reply. The cap is the most likely thing in this document to be wrong; pick the figure
you would be annoyed but not alarmed to see, divided by 30.

**What would change the decision:** if the API moves to always-on, half of S2 evaporates and
step 4 loses its urgency (though not its availability benefit). If the chatbot ever becomes
load-bearing, ADR 0002's trade inverts. If traffic ever stopped being portfolio traffic, the
whole style choice reopens.

**The largest available simplification is one feature away.** MongoDB exists solely to back
`/chat/:id` reload continuity. If that is not actually used, dropping persistence removes a
container, a vendor and a connection, and makes the API stateless. Worth checking before
building anything.

## 14. Open questions

- Is `/chat/:id` reload continuity actually used? (See above — it removes a container.)
- Cloudflare Pages or Render Static Site? Both satisfy the architecture; Cloudflare adds edge
  rate limiting that would strengthen S1.
- `claude-opus-5` or `claude-haiku-4-5`? The guard makes either safe, so this is quality vs cost,
  not architecture.
- Add a Turnstile check? Stops casual scripted abuse earlier, at the cost of a third-party script.

## 15. Glossary

**Abuse guard** — the ordered middleware chain (size cap → per-IP rate limit → global daily token
ceiling) that every request passes before any billable Anthropic call.
**Cold start** — the delay while Render wakes a scaled-to-zero service.
**Fitness function** — an automated check that fails the build when an architectural property
erodes.
