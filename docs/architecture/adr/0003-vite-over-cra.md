# 0003. Use Vite in place of Create React App

- Status: accepted
- Date: 2026-08-31
- Deciders: Filip
- Drivers: maintainability

## Context

The frontend builds with `react-scripts` 5.0.1. Create React App is no longer maintained. It
pins the project to TypeScript 4.9 and is the reason dependency upgrades have become
unpleasant — the stated third pain in this design run. It also produces the situation in the
Dockerfile where the production container runs `react-scripts start`, a development server,
because that is what `npm start` means in a CRA project.

## Options considered

- **Keep CRA** — zero work now, compounding cost later, and no upgrade path.
- **Vite** — a like-for-like SPA bundler; the app stays a client-rendered SPA.
- **Next.js or Remix** — full frameworks with a server runtime.

## Decision

Migrate the build to Vite. The application stays a client-rendered SPA producing static output.

## Consequences

**Good:** unblocks TypeScript 5, React and MUI upgrades. Dramatically faster local iteration.
Removes the last unmaintained dependency in the build path, which is what fitness function f5
is there to keep true.

**Bad:** a real migration with real risk. `REACT_APP_*` environment variables become `VITE_*`
and the inlining rules differ — which is precisely the mechanism by which a secret could
accidentally reach the bundle (risk r3, covered by fitness function f2). CRA-specific import
behaviours must be checked one by one.

**Rejected — Next.js and Remix:** both reintroduce a server runtime for the portfolio, which
directly undoes decision 0001. The whole point of that decision is that the portfolio has no
runtime to wake up. Adopting a framework whose value is server rendering, in order to serve
content that is already static, would trade the primary win of this design for build-time
conveniences we do not need.

**Sequencing:** this migration happens *after* the static host is live (roadmap step 5, not 4),
so that the previously published build remains deployable as an instant rollback.
