#!/usr/bin/env node
"use strict";

// Fitness function f6 (docs/architecture/README.md, section 11; ADR 0006):
// pages under /pages/ are static. None may call this site's API -- the chat
// endpoint is the one dynamic, billable surface (ADR 0001, ADR 0002), and f4's
// import walk covers only the portfolio's own routes, not pages built from
// frontend/pages/. This scans the built pages for anything that addresses the
// API: its Render host, its path, or the local dev API.
//
// Run after `npm run build-frontend`:
//   node scripts/check-pages-static.js

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const PAGES_BUILD = path.join(REPO_ROOT, "frontend/build/pages");
const TEXT_EXTENSIONS = new Set([".html", ".js", ".mjs", ".css", ".json", ".map", ".txt", ".svg"]);

const API_PATTERNS = [
  { name: "the backend's Render host", pattern: /mern-backend[\w-]*\.onrender\.com/ },
  { name: "the chat API path", pattern: /\/api\/chat\b/ },
  { name: "the local dev API", pattern: /localhost:4000/ },
  { name: "VITE_API_URL", pattern: /VITE_API_URL/ },
];

function textFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name)))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

function main() {
  if (!fs.existsSync(PAGES_BUILD)) {
    console.error("f6: frontend/build/pages not found; run `npm run build-frontend` first.");
    process.exit(1);
  }
  const files = textFiles(PAGES_BUILD);
  const findings = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    for (const { name, pattern } of API_PATTERNS) {
      if (pattern.test(content)) {
        findings.push(`${path.relative(REPO_ROOT, file)}: refers to ${name}`);
      }
    }
  }
  console.log(`f6: scanned ${files.length} file(s) in frontend/build/pages.`);
  if (findings.length > 0) {
    console.error("f6 FAILED: a page addresses this site's API (ADR 0006: pages are static):");
    for (const finding of findings) console.error(`  - ${finding}`);
    process.exit(1);
  }
  console.log("f6: no page addresses the API. OK.");
}

main();
