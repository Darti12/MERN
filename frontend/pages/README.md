# Pages

Small standalone pages that live at `filiphagen.com/pages/<name>/`, next to the portfolio
(ADR 0006). Each page is its own app: its own folder, dependencies, styling and build. A page
can't break another page or the portfolio, and none of them share code.

The build (`frontend/scripts/build-pages.mjs`, run by `npm run build`) builds every page,
copies its output to `build/pages/<name>/`, adds the shared nav bar to it, and writes the
index at `/pages/`. Render deploys `main`, so a page goes live when it lands there.

## Adding a page

1. Pick a name: lowercase letters, digits and single dashes (`oslo-weather`). It is the URL.
   Folders starting with `_` are not pages.
2. Make `frontend/pages/<name>/`, either way:
   - **Built**: a `package.json` with a `build` script that writes `dist/index.html`, and a
     committed `package-lock.json`. Any stack (Vite + React, Svelte, vanilla TS, ...). The
     build is run with `npm ci && npm run build` inside the folder.
   - **Static**: plain `index.html`, CSS and JS, served as they are.
3. Add it to `pages.json`:
   ```json
   { "name": "oslo-weather", "title": "Oslo weather", "description": "One line on what it shows.", "made": "2026-10-20" }
   ```
4. Build and check from the repo root (the same as CI):
   ```sh
   npm run build-frontend
   node scripts/check-frontend-secrets.js
   node scripts/check-bundle-size.js
   node scripts/check-portfolio-api-independence.js
   node scripts/check-pages-static.js
   ```
   Then look at it: `cd frontend && npx vite preview` and open `http://localhost:4173/pages/<name>/`.

Changing a page: edit its folder (and its `pages.json` entry if the title or description
changed). Removing one: delete the folder and its entry; its URL stops working.

## Rules

- **Relative paths only.** Assets load from the page's own folder: Vite `base: "./"`,
  `<script src="./main.js">`, never `/assets/...` (that is the portfolio's). The build fails
  on a root-absolute `src` or stylesheet path outside `/pages/<name>/`.
- **No client-side routes in the URL path.** Render serves `/pages/<name>/` and the files in
  it; any other path under it falls through to the portfolio. A page with several views uses
  hash routing (`#/details`) or query strings.
- **Static.** A page never calls this site's API (`/api/chat`, the Render backend) or Robin's;
  `scripts/check-pages-static.js` (fitness function f6) fails the build if it does. Data a page
  needs is gathered when it is made and committed with it. Public third-party data loaded in
  the browser is fine.
- **No secrets.** Everything here is public, both the repository and the site. f2 scans the
  pages' output too.
- **Own styling.** Style the page however it suits. Leave room for the 40px nav bar the build
  adds at the top of `<body>` (`min-height: calc(100vh - 40px)` rather than `100vh`).
- **Own dependencies.** Keep them in the page's own `package.json`; never import from
  `frontend/src` or another page. `npm audit --audit-level=high` runs on each page in CI.
