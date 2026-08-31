# Build roadmap

Slices, ordered riskiest-first among steps that are independently valuable. Every step is
independently abandonable — if you stop after any one of them, the site is in a better state
than before it.

## Slice 0 — Stop the bleeding

**1. Abuse guard on `/api/chat`** — request body size cap, per-IP rate limit
(`express-rate-limit`), and a persisted global daily token ceiling, applied *in that order,
before* any Anthropic call.
*Proves:* scenario S1. *Risk:* low. *Rollback:* remove the middleware.
**Do this first.** Everything else in this document can wait; this is live exposure.

**2. CI pipeline** — install, build, test on push.
*Proves:* fitness functions can exist at all. *Risk:* low.
Worthless if added after the erosion, which is why it is here and not at the end.

**3. Fitness functions f1, f2, f3.** Depends on 1 and 2.
*Proves:* the guard cannot silently regress and secrets cannot reach the bundle.

## Slice 1 — Deployment honesty

**4. Real `/health` route; container serves built assets instead of `react-scripts start`.**
*Proves:* the deployment stops lying about its own state. *Risk:* low. *Rollback:* revert two files.

**5. Delete workouts, admin, projects and user code** across frontend and backend — routes,
controllers, models, RTK Query slices, `userSlice`, `RequireUser`, login and register pages,
the `/admin` tree.
*Proves:* the portfolio-only scope holds; nothing public depended on any of it. *Risk:* low.
*Rollback:* revert the commit.

## Slice 2 — Walking skeleton

**6. Build the SPA, publish to a static host, point chat at the API by absolute URL, verify end
to end.**
*Proves:* the whole shape — static portfolio, remote API, external LLM, datastore — holds
together. This is the thinnest end-to-end path through every container.
*Risk:* medium. *Rollback:* repoint DNS at the Render service, which still serves the app.

**7. Fitness function f4** — bundle ceiling, and the assertion that no route other than `/chat`
issues an API request. Depends on 6.
*Proves:* scenario S2 cannot regress.

## Slice 3 — Stop the rot

**8. Migrate the frontend build to Vite.** Depends on 6, so the previously published static build
is an instant rollback.
*Proves:* scenario S3. *Risk:* medium.

**9. Adopt `@anthropic-ai/sdk`, move to `claude-opus-5`, stream responses to the chat UI.**
Depends on 1.
*Proves:* correct retry semantics and fast first token. *Risk:* low.

**10. TTL index on chats; remove the `user_id: "blank"` placeholder; harden transcript retrieval.**
Depends on 5.
*Proves:* anonymous data minimisation. Closes the "any stranger's transcript by id" risk.

---

**Before starting slice 2**, answer the open question in §14 of the architecture README: if
`/chat/:id` reload continuity is unused, drop persistence entirely. That removes a container, a
vendor and a connection, and makes the API stateless — the largest simplification available, and
cheaper to take before you build on top of the current shape than after.
