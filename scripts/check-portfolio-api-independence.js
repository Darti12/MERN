#!/usr/bin/env node
"use strict";

// Fitness function f4, assertion 2 of 2 (docs/architecture/README.md,
// section 11; ADR 0001's explicit "Follow-up"): no route other than /chat
// may issue an API request. ADR 0001 quote: "the independence bought here
// is exactly the kind of property that erodes the first time someone finds
// it convenient to fetch something on the About page." This check is that
// backstop.
//
// Static check, no new dependencies (mirrors scripts/check-frontend-secrets.js,
// f2): starting from every local module frontend/src/App.tsx imports
// directly EXCEPT pages/Chat.tsx (the one route allowed to talk to the
// API), walk the local (relative) import graph. Chat.tsx's own subtree
// (ChatBubble, frontend/src/api/**, config.ts's CHAT_API_BASE_URL/HEALTH_URL)
// is deliberately excluded from the walk -- reaching those from Chat.tsx is
// not a violation, it is the one sanctioned path this fitness function
// exists to keep sanctioned. Two things fail the walk:
//   1. reaching any module under frontend/src/api/ (the API client(s)), and
//   2. any reachable module containing a raw fetch(...) call, as a backstop
//      against an inline fetch that bypasses the client entirely.
//
// This generalizes to routes added later without editing this file: any new
// <Route> element's component gets pulled in as an entry point automatically
// because it's a new import in App.tsx, and anything *it* imports gets
// walked too.
//
// Run: node scripts/check-portfolio-api-independence.js

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "frontend/src");
const APP_FILE = path.join(SRC_DIR, "App.tsx");
const API_DIR = path.join(SRC_DIR, "api") + path.sep;

// The one route allowed to import the API client / issue fetch calls.
const CHAT_ENTRY = path.join(SRC_DIR, "pages/Chat.tsx");

const RESOLVE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith(".")) return null; // package import, not local -- not walked
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    ...RESOLVE_EXTENSIONS.map((ext) => base + ext),
    ...RESOLVE_EXTENSIONS.map((ext) => path.join(base, "index" + ext)),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

// Deliberately several small, specific patterns rather than one clever
// regex -- easier to verify each one only matches what it claims to.
const IMPORT_PATTERNS = [
  /import\s+[^;'"]*?from\s+["']([^"']+)["']/g, // import X [, {Y}] from "..."
  /import\s+["']([^"']+)["']/g, // import "..." (side-effect import)
  /import\(\s*["']([^"']+)["']\s*\)/g, // dynamic import("...")
  /require\(\s*["']([^"']+)["']\s*\)/g, // require("...")
  /export\s+[^;'"]*?from\s+["']([^"']+)["']/g, // export ... from "..."
];

function extractImportSpecifiers(content) {
  const specifiers = [];
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

function collectEntryFiles() {
  const appContent = fs.readFileSync(APP_FILE, "utf8");
  const entries = [];
  for (const spec of extractImportSpecifiers(appContent)) {
    const resolved = resolveImport(APP_FILE, spec);
    if (resolved && resolved !== CHAT_ENTRY) {
      entries.push(resolved);
    }
  }
  return [...new Set(entries)];
}

function walk(entryFiles) {
  const visited = new Set();
  const queue = [...entryFiles];
  const apiOffenders = [];
  const fetchOffenders = [];

  while (queue.length > 0) {
    const file = queue.shift();
    if (visited.has(file)) continue;
    if (file === CHAT_ENTRY) continue; // never walk into the sanctioned route
    visited.add(file);

    const content = fs.readFileSync(file, "utf8");
    const relPath = path.relative(REPO_ROOT, file);

    if (file.startsWith(API_DIR)) {
      apiOffenders.push(relPath);
    }
    if (/\bfetch\s*\(/.test(content)) {
      fetchOffenders.push(relPath);
    }

    for (const spec of extractImportSpecifiers(content)) {
      const resolved = resolveImport(file, spec);
      if (resolved && !visited.has(resolved)) {
        queue.push(resolved);
      }
    }
  }

  return { apiOffenders, fetchOffenders, filesScanned: visited.size };
}

function main() {
  if (!fs.existsSync(APP_FILE)) {
    console.error(
      `f4: expected the route tree at ${path.relative(REPO_ROOT, APP_FILE)}, not found.`
    );
    process.exit(1);
  }

  const entries = collectEntryFiles();
  if (entries.length === 0) {
    console.error(
      "f4: found no local entry modules imported by App.tsx -- check IMPORT_PATTERNS against App.tsx's actual import style."
    );
    process.exit(1);
  }

  console.log(
    `f4: walking the non-chat route tree from ${entries.length} entry module(s) imported by App.tsx.`
  );

  const { apiOffenders, fetchOffenders, filesScanned } = walk(entries);

  console.log(`f4: ${filesScanned} module(s) reachable from non-chat routes scanned.`);

  const findings = [];
  for (const f of apiOffenders) {
    findings.push(
      `${f}: reachable from a non-chat route and lives under frontend/src/api/ (an API client)`
    );
  }
  for (const f of fetchOffenders) {
    findings.push(
      `${f}: reachable from a non-chat route and calls fetch(...) directly`
    );
  }

  if (findings.length > 0) {
    console.error(
      "f4 FAILED: a non-chat route can issue an API request (ADR 0001 violation):"
    );
    for (const finding of findings) {
      console.error(`  - ${finding}`);
    }
    console.error(
      "f4: only frontend/src/pages/Chat.tsx (and what it alone imports) may talk to the API. Remove the reachable import/fetch, or move the code so only Chat.tsx reaches it."
    );
    process.exit(1);
  }

  console.log("f4: no non-chat route reaches the API. OK.");
}

main();
