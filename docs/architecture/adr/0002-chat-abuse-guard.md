# 0002. Use a rate limit and spend ceiling instead of authentication to protect the chat endpoint

- Status: accepted
- Date: 2026-08-31
- Deciders: Filip
- Drivers: security, affordability

## Context

`backend/routes/chats.js` has its `requireAuth` import and `router.use(requireAuth)` commented
out, and `App.tsx` has the matching `RequireUser` wrapper commented out around the chat route.
The result is live in production: `POST /api/chat` is unauthenticated and calls the Anthropic
Messages API on Filip's key. There is no rate limit, no request size cap, and no ceiling on
spend. The handler retries up to five times on *any* error, including a 400, so malformed input
multiplies the call volume rather than failing fast.

**`POST` is not the only billable path.** `PATCH /api/chat/:id` also calls
`sendMessageToClaude`, and was even less defended — it had no validation of the message array at
all. Any control that covers only the create path leaves an equivalent hole open next to it. See
the amendment at the foot of this ADR.

The obvious fix — put the endpoint behind a login — is unavailable. The chatbot exists so that a
recruiter who has never met Filip can ask questions about him. A login gate makes it useless.
Identity is therefore not available as an abuse control, which is what makes this the hard
problem in the system rather than a routine one.

## Options considered

- **Require authentication** — restores the commented-out middleware. Defeats the feature.
- **Per-IP rate limiting alone** — bounds any single caller's volume, but a distributed caller
  or a rotating IP defeats it, and it places no ceiling on total spend.
- **A global daily spend ceiling alone** — bounds the bill absolutely, but lets one caller
  consume the whole day's budget in minutes.
- **Both, plus a request size cap** — per-caller fairness and an absolute backstop.
- **Cloudflare Turnstile** — proof-of-humanity before the request is made.

## Decision

Apply, in order, before any billable call: a request body size cap, a per-IP rate limit
(`express-rate-limit`), and a persisted global daily token-spend counter that rejects outright
once a configured ceiling is reached. Turnstile is deferred as a later addition rather than a
prerequisite.

This chain applies to **every** route that can reach the Anthropic API — currently
`POST /api/chat` and `PATCH /api/chat/:id` — not to the create path alone.

## Consequences

**Good:** worst-case spend in any 24-hour window becomes a number Filip configures rather than a
number an attacker chooses. The two controls cover each other's gap: the rate limit stops one
caller monopolising the budget, the ceiling stops many callers exhausting it. Both are
set-and-forget middleware, which matters given a maintainer with no ops time (risk r7).

**Bad — and this is the real trade:** a determined abuser can exhaust the daily ceiling and deny
the chatbot to genuine visitors for the rest of the day. We are deliberately choosing
availability loss over unbounded cost. For a personal portfolio chatbot with no revenue behind
it, a chatbot that says "back tomorrow" is strictly better than a surprise invoice. If the
chatbot ever becomes load-bearing, this decision needs revisiting — it is the sensitivity point
of the whole design.

**Also bad:** the ceiling is a global counter, so it is shared state the API must read before
every call. On a single instance this is trivial; it would need care if the API were ever
scaled out.

**Follow-up:** fitness functions f1 and f3. f1 asserts the guard actually blocks, including that
*zero* Anthropic calls occur once the ceiling is hit — a guard that rejects after paying is not a
guard. f3 fails the build when any new route is added without declaring its exposure, because
this entire ADR exists because two lines got commented out and nothing noticed.

## Amendment — 2026-08-31

This ADR originally described the exposure as `POST /api/chat` alone. That was wrong, and the
error was in the analysis, not the implementation: `PATCH /api/chat/:id` calls the same
`sendMessageToClaude` function and was equally unauthenticated, unmetered, and — unlike the
create path — had no message-array validation whatsoever. The original roadmap and the task
description derived from this ADR both inherited the omission.

It was caught during implementation, and the guard chain was applied to both routes.

The decision is unchanged; only the stated scope of the problem is corrected. The lesson worth
keeping is the one now encoded in fitness function f3: enumerate the routes that exist rather
than reasoning about the routes you remember. A control that covers the path you were thinking
about is not a control over the system.

## Amendment 2 — 2026-08-31: the guard fails closed

The first implementation of the token ceiling failed *open*: if the usage
counter could not be read, the request was allowed through and the Anthropic
call went ahead unmetered. The reasoning was that a database blip should not
take the chatbot down.

That is the wrong trade for a cost control, and it fails in the worst possible
direction. The single promise this ADR makes is that worst-case spend is a
number Filip chooses. Failing open voids that promise precisely when the
infrastructure is unhealthy and nobody is watching the bill.

It also interacted badly with a change made at the same time. The API used to
call `app.listen` inside `mongoose.connect().then(...)`, so a database outage
meant the port never opened and no request ever reached the guard — the system
was protected by accident. Opening the port first (so `/health` can answer
during an outage, rather than failing the deploy) removed that accident and
made the fail-open path genuinely reachable in production.

`checkTokenCeiling` now returns **503** when the counter cannot be read: the
budget is not known to be exhausted, the service is temporarily unable to
verify it, which is a different statement from the 429 returned when the
ceiling really has been hit. The cost is that a database outage disables the
chatbot entirely. That is the same trade this ADR already made when it chose a
global ceiling over an unbounded bill, applied consistently.

Guarded by a regression test in `backend/tests/security/chatGuard.tokenCeiling.test.js`.

## Amendment 3 — 2026-09-01: the rate limit was not persistent

The Decision above says the per-IP rate limit and the global ceiling "cover
each other's gap: the rate limit stops one caller monopolising the budget, the
ceiling stops many callers exhausting it." In production the first half was
close to fiction.

`express-rate-limit` defaults to an in-memory store, and this API runs
scale-to-zero on Render's free tier, where a web service spins down after
inactivity. Every cold start wiped the counter, so "20 requests per IP per 24
hours" actually meant "20 per process lifetime" — and on a portfolio site with
sparse traffic, a process lives for minutes. This was observed directly: four
requests were sent across a redeploy and the limiter reported 19 remaining.

The bill was never at risk, because the daily token ceiling is persisted in
MongoDB and survived. Only per-caller fairness was affected. But the ADR
claimed a protection that was not there, which is worse than not claiming it.

The limiter is now backed by the same database as the ceiling
(`backend/middleware/mongoRateLimitStore.js`), with a TTL index reaping expired
windows. If the store itself fails, the request is refused with 503 rather than
allowed through — consistent with amendment 2's fail-closed rule.

Guarded by `backend/tests/security/chatGuard.rateLimitPersistence.test.js`,
which simulates a restart with a second limiter and store instance sharing only
the database, and asserts the count carries across.

