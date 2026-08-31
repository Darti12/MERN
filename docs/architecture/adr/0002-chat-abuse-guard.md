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
