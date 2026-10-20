// The bar at the top of every page under /pages/ (ADR 0006): links to the
// portfolio, to the index of pages, and to every other page. The build
// (frontend/scripts/build-pages.mjs) fills in PAGES with the page list
// and adds <script src="/pages/_nav.js" defer> to each page's HTML.
//
// It lives in its own shadow root, so its styles can't leak into the page
// and the page's styles can't reach inside it. It sits in normal flow as the
// body's first child, so it takes its own height instead of covering the
// page. Plain JS with no dependencies, so it works on any page's stack.
(() => {
  const PAGES = __PAGES__;
  const TAG = "site-pages-nav";
  if (customElements.get(TAG)) return;

  const STYLE = `
    :host { all: initial; display: block; position: relative; z-index: 2147483647;
      --bg: #EDE7DE; --fg: #025A4E; --accent: #FFC107; --line: rgba(2, 90, 78, 0.2); }
    @media (prefers-color-scheme: dark) {
      :host { --bg: #233831; --fg: #8FDCC2; --line: rgba(143, 220, 194, 0.25); }
    }
    nav { display: flex; align-items: center; gap: 16px; height: 40px; padding: 0 16px;
      background: var(--bg); color: var(--fg); border-bottom: 1px solid var(--line);
      font: 500 14px/1 system-ui, -apple-system, "Segoe UI", sans-serif; box-sizing: border-box; }
    a { color: inherit; text-decoration: none; }
    a:hover, a:focus-visible, summary:hover { color: var(--accent); }
    .home { font-weight: 700; white-space: nowrap; }
    .current { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.8; }
    details { position: relative; margin-left: auto; }
    summary { cursor: pointer; list-style: none; white-space: nowrap; }
    summary::-webkit-details-marker { display: none; }
    ul { position: absolute; right: 0; top: 28px; margin: 0; padding: 6px 0; list-style: none;
      min-width: 200px; max-width: min(320px, 90vw); max-height: 60vh; overflow: auto;
      background: var(--bg); border: 1px solid var(--line); border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); }
    li a { display: block; padding: 8px 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    li a[aria-current="page"] { font-weight: 700; }
  `;

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  }

  class SitePagesNav extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode: "open" });
      const here = location.pathname.split("/")[2] || "";
      const current = PAGES.find((page) => page.name === here);
      const links = PAGES.map((page) => {
        const mark = page.name === here ? ' aria-current="page"' : "";
        return `<li><a href="/pages/${page.name}/"${mark}>${escapeHtml(page.title)}</a></li>`;
      }).join("");
      root.innerHTML = `<style>${STYLE}</style>
        <nav aria-label="Site">
          <a class="home" href="/">Filip Hagen</a>
          <a href="/pages/">Pages</a>
          ${current ? `<span class="current">${escapeHtml(current.title)}</span>` : ""}
          ${links ? `<details><summary>All pages ▾</summary><ul>${links}</ul></details>` : ""}
        </nav>`;
      const menu = root.querySelector("details");
      if (menu) {
        document.addEventListener("click", (event) => {
          if (!event.composedPath().includes(menu)) menu.open = false;
        });
      }
    }
  }

  // Full width even when the page keeps the body's default margin: pull out
  // over the margin, and give the top margin back below the bar.
  function insert() {
    const bar = document.createElement(TAG);
    const body = getComputedStyle(document.body);
    bar.style.margin = `-${body.marginTop} -${body.marginRight} ${body.marginTop} -${body.marginLeft}`;
    document.body.prepend(bar);
  }

  customElements.define(TAG, SitePagesNav);
  if (document.body) insert();
  else document.addEventListener("DOMContentLoaded", insert);
})();
