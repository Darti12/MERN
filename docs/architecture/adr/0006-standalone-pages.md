# 0006. Serve standalone pages under /pages/, each built as its own app

- Status: accepted
- Date: 2026-10-20
- Deciders: Filip
- Drivers: isolation, responsiveness, security

## Context

Filip wants Robin, his agent harness, to make small pages on request ("a page about X") and
publish them on this site at a link that lasts. Pages are made by an agent, one at a time, with
whatever stack suits each one. They must be easy to move between, and separate from each other
and from the portfolio: a new page must not be able to restyle, slow down or break another
page or the portfolio.

## Options considered

- **Routes inside the portfolio SPA** — each page a React route in `frontend/src`. Shares the
  bundle, theme and dependency versions; one heavy page taxes every visitor (f4), and one bad
  page breaks the build for all of them.
- **Module Federation** — the portfolio loads each page at runtime as a remote module. Smooth
  navigation, but pages share a runtime and React/MUI versions, and a broken remote can take
  down the shell.
- **Iframes in the portfolio shell** — strong isolation, but deep links, sizing and mobile
  layout get awkward.
- **One build per path** — each page is its own app in `frontend/pages/<name>/`, built on its
  own and served as static files at `/pages/<name>/`, linked by a small shared nav bar and an
  index.

## Decision

One build per path. `frontend/scripts/build-pages.mjs` runs after the portfolio's build: it
installs and builds each page in its own folder, copies the output to `build/pages/<name>/`,
adds the shared nav bar (a dependency-free web component in a shadow root), and writes the
index at `/pages/` from `frontend/pages/pages.json`. Pages are static and public, and the
agent pushes them straight to `main`, which Render deploys.

## Consequences

**Good:** a page can't affect another page or the portfolio at runtime: no shared code,
styles or dependency versions. The portfolio's bundle and f4 are unchanged. Still one static
site and one deploy, with no runtime, so ADR 0001's reasoning holds.

**Bad:** a page that fails to build fails the whole site's build, so nothing deploys until it
is fixed or removed; the agent runs the build and the checks before pushing. Every page's
`npm ci` runs on every build, so builds get slower as pages are added. Moving between pages
is a full page load.

**Rules this adds** (frontend/pages/README.md): relative asset paths only; no client-side
routes in the URL path (Render's SPA rewrite would hand them to the portfolio; use hash
routing); no API calls (fitness function f6); no secrets, since the repository is public.

## Amendment — 2026-10-20: private pages in the overview

Private pages are served by Robin, behind its login, never from this repository (it is
public). The index at `/pages/` frames Robin's `/pages/_embed`, which lists them only while
Filip is signed in to Robin and is empty for anyone else. The two hosts share the site
filiphagen.com, so the browser sends Robin's login cookie to the frame. The list is drawn
inside the frame, so no script on this site (agent-made pages included) can read it; Robin
only posts the frame's height, and allows only this site to frame it (`frame-ancestors`).
