#!/usr/bin/env node
// Builds every page in frontend/pages/ into build/pages/<name>/, after the
// portfolio's own `vite build` (ADR 0006). Each page is its own app: it is
// installed and built in its own folder with its own dependencies, and only
// its output is copied next to the portfolio, so no page shares code, styles
// or dependency versions with another page or with the portfolio.
//
// What it does, in order:
//   1. Reads frontend/pages/pages.json and checks it against the folders:
//      every page listed has a folder, every folder is listed (folders whose
//      name starts with "_" are not pages), names are URL-safe.
//   2. Builds each page: a folder with package.json gets `npm ci` and
//      `npm run build` and must produce dist/index.html; a folder without one
//      is plain static files and must have index.html.
//   3. Refuses root-absolute asset paths (src="/assets/x.js"), which would
//      load the portfolio's files instead of the page's own. Pages build with
//      relative paths (Vite: base: "./").
//   4. Adds the shared nav bar (_shared/nav.js, with the page list baked in)
//      to every HTML file of every page, and writes the index at /pages/.
//
// Any problem exits non-zero, so the whole build fails and nothing deploys.
// See frontend/pages/README.md for the contract a page follows.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES_DIR = path.join(FRONTEND, "pages");
const SHARED_DIR = path.join(PAGES_DIR, "_shared");
const OUT_DIR = path.join(FRONTEND, "build", "pages");
const NAV_SRC = "/pages/_nav.js";
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function fail(message) {
  console.error(`pages: ${message}`);
  process.exit(1);
}

function readList() {
  const list = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, "pages.json"), "utf8"));
  if (!Array.isArray(list)) fail("pages.json must be an array");
  const names = new Set();
  for (const page of list) {
    if (!NAME.test(page.name ?? "")) {
      fail(`"${page.name}" is not a page name: lowercase letters, digits and single dashes`);
    }
    if (names.has(page.name)) fail(`"${page.name}" is listed twice in pages.json`);
    names.add(page.name);
    if (!page.title || !page.description || !DATE.test(page.made ?? "")) {
      fail(`${page.name}: pages.json needs title, description and made (YYYY-MM-DD)`);
    }
    if (!fs.existsSync(path.join(PAGES_DIR, page.name))) {
      fail(`${page.name}: listed in pages.json, but frontend/pages/${page.name}/ doesn't exist`);
    }
  }
  for (const entry of fs.readdirSync(PAGES_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith("_") && !names.has(entry.name)) {
      fail(`frontend/pages/${entry.name}/ isn't listed in pages.json`);
    }
  }
  return list;
}

function run(command, args, cwd) {
  console.log(`pages: ${path.relative(FRONTEND, cwd)}: ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

// The folder whose files are served: dist/ for a built page, the folder itself
// for plain static files.
function buildPage(name) {
  const dir = path.join(PAGES_DIR, name);
  if (!fs.existsSync(path.join(dir, "package.json"))) return dir;
  if (!fs.existsSync(path.join(dir, "package-lock.json"))) {
    fail(`${name}: has package.json but no package-lock.json; run npm install there`);
  }
  run("npm", ["ci", "--no-audit", "--no-fund"], dir);
  run("npm", ["run", "build"], dir);
  return path.join(dir, "dist");
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

// src="/..." or <link href="/..."> outside the page's own path.
const ROOT_ABSOLUTE = /<(?:script|link|img|source|video|audio|iframe)\b[^>]*?\b(?:src|href)=["'](\/(?!\/)[^"']*)["']/gi;

function checkPaths(name, file) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(ROOT_ABSOLUTE)) {
    const url = match[1];
    if (!url.startsWith(`/pages/${name}/`) && url !== NAV_SRC) {
      fail(`${name}: ${path.basename(file)} loads "${url}", which is outside /pages/${name}/; ` +
        `use relative paths (Vite: base: "./")`);
    }
  }
}

function addNav(file) {
  const html = fs.readFileSync(file, "utf8");
  if (html.includes(NAV_SRC)) return;
  const tag = `<script src="${NAV_SRC}" defer></script>`;
  const withNav = html.includes("</head>") ? html.replace("</head>", `${tag}\n</head>`) : tag + html;
  fs.writeFileSync(file, withNav);
}

// Fills a template's one __PAGES__ placeholder.
function fill(template, file, value) {
  if (template.split("__PAGES__").length !== 2) fail(`${file} must contain __PAGES__ exactly once`);
  return template.replace("__PAGES__", () => value);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function writeIndex(list) {
  const newestFirst = [...list].sort((a, b) => b.made.localeCompare(a.made));
  const items = newestFirst.map((page) => `      <li>
        <a href="/pages/${page.name}/">${escapeHtml(page.title)}</a>
        <p>${escapeHtml(page.description)}</p>
        <time datetime="${page.made}">${page.made}</time>
      </li>`);
  const body = items.length ? `<ul>\n${items.join("\n")}\n    </ul>` : "<p>No public pages yet.</p>";
  const template = fs.readFileSync(path.join(SHARED_DIR, "index.html"), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), fill(template, "_shared/index.html", body));
}

function writeNav(list) {
  const pages = list.map(({ name, title }) => ({ name, title }));
  const nav = fs.readFileSync(path.join(SHARED_DIR, "nav.js"), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "_nav.js"), fill(nav, "_shared/nav.js", JSON.stringify(pages)));
}

function main() {
  const list = readList();
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const { name } of list) {
    const served = buildPage(name);
    if (!fs.existsSync(path.join(served, "index.html"))) {
      fail(`${name}: no index.html in ${path.relative(FRONTEND, served)}`);
    }
    const out = path.join(OUT_DIR, name);
    fs.cpSync(served, out, {
      recursive: true,
      filter: (source) => !source.split(path.sep).includes("node_modules"),
    });
    for (const file of htmlFiles(out)) {
      checkPaths(name, file);
      addNav(file);
    }
  }
  writeNav(list);
  writeIndex(list);
  addNav(path.join(OUT_DIR, "index.html"));
  console.log(`pages: built ${list.length} page(s) into ${path.relative(FRONTEND, OUT_DIR)}/`);
}

main();
