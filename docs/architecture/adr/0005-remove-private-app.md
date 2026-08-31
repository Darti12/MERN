# 0005. Remove the workouts and admin application from the codebase

- Status: accepted
- Date: 2026-08-31
- Deciders: Filip
- Drivers: maintainability, security

## Context

The repository began as a MERN learning project and grew a portfolio site on top of it. Two
products now share one deployment: a public portfolio, and a private application with JWT auth,
user signup, a workouts CRUD, an `/admin` route tree and a projects CRUD. Filip has confirmed
the private half is no longer wanted.

The projects API is already vestigial: `Projects.tsx` renders from a hardcoded list and i18n
translation files, while `projectApi.ts` points at an authenticated endpoint nothing public
calls.

## Options considered

- **Keep it** — it works, and deleting code is scary.
- **Delete it** — remove the routes, controllers, models, API slices, pages and auth.
- **Extract it** — move it to its own repository for later.

## Decision

Delete the user, workouts and projects surface across both frontend and backend: routes,
controllers, models, RTK Query slices, `userSlice`, `RequireUser`, the login and register pages,
and the `/admin` route tree. It remains recoverable from git history.

## Consequences

**Good:** removes JWT handling, password storage and signup — the largest attack surface in the
system — from a site that no longer needs any of it. Removes the `Authorization` header plumbing
from the frontend. Substantially shrinks what a returning maintainer has to understand, which is
the maintainability driver stated plainly.

**Bad:** the existing test suite covers exactly the code being deleted (user and workout models,
controllers and auth middleware), so test coverage drops to near zero at the moment of deletion.
That is uncomfortable but honest: those tests were protecting code that no longer runs, while the
chat path that does run has never been tested. Roadmap item `f-security` redirects the harness at
the code that matters.

**Bad:** JWTs are currently stored in `localStorage`, which is an XSS-exposed location. Deleting
auth resolves this by removing the token rather than by fixing the storage — worth recording, so
that reintroducing auth later does not silently reintroduce the flaw.

**Follow-up:** deleting the auth middleware means `requireAuth` no longer exists to be
accidentally re-enabled or left commented out. The commented-out `requireAuth` in
`routes/chats.js` (see ADR 0002) goes away as a concept, replaced by an explicit route allowlist
enforced by fitness function f3.
