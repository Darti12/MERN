#!/usr/bin/env node
"use strict";

// Fitness function f4, assertion 1 of 2 (docs/architecture/README.md,
// section 11; ADR 0001's "responsiveness" driver): the initial JS bundle
// must stay under a gzip size ceiling. ADR 0001's whole point is that the
// portfolio loads at CDN speed regardless of API state -- that benefit is
// wasted if the payload it serves is allowed to grow unchecked. This is a
// ratchet, not a one-time pass: it should fail the day someone adds a heavy
// dependency without noticing, not just today.
//
// "Initial JS bundle" is defined operationally as exactly the JS the browser
// fetches eagerly on first load: every <script src> and
// <link rel="modulepreload"> in the built index.html. There is no
// route-level code splitting today (frontend/src/App.tsx imports every page
// eagerly, see fitness function f4's other half in
// check-portfolio-api-independence.js), so that is currently the whole
// bundle -- but defining it this way means the check keeps meaning the same
// thing if lazy route chunks are ever introduced: a lazily-loaded chunk
// isn't referenced eagerly from index.html, so it correctly falls outside
// what this ceiling covers.
//
// CEILING_BYTES was set by measuring this repo's real production build
// right after the CRA -> Vite migration (ADR 0003, task `vite`) landed, on
// 2026-08-31: frontend/build/assets/index-C36F3f4k.js gzipped (Node zlib,
// Z_BEST_COMPRESSION, the same method this script uses) to 198,975 bytes
// (~194.3 KiB). The ceiling below is 235,520 bytes (230 KiB) -- about 18%
// of headroom above that measurement, enough to absorb routine dependency
// bumps without masking a real regression. This is meant to ratchet down
// over time as the app is optimized, and to only go up for a deliberate,
// reviewed addition (bump it here, with a comment explaining why).
const CEILING_BYTES = 235520; // 230 KiB gzip

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const REPO_ROOT = path.resolve(__dirname, "..");

// Same candidate list as scripts/check-frontend-secrets.js (f2), for the
// same reason: frontend/vite.config.ts sets build.outDir to "build" to match
// render.yaml's staticPublishPath, but frontend/dist -- Vite's own default
// -- is kept as a fallback in case that setting is ever removed.
const CANDIDATE_BUILD_DIRS = ["frontend/build", "frontend/dist"];

function findBuildDir() {
  for (const candidate of CANDIDATE_BUILD_DIRS) {
    const full = path.join(REPO_ROOT, candidate);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      return full;
    }
  }
  return null;
}

// Matches both attribute orders (src-then-rel and rel-then-src) since HTML
// attribute order isn't guaranteed by any bundler.
const SCRIPT_SRC_PATTERN = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
const MODULEPRELOAD_PATTERNS = [
  /<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi,
  /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']modulepreload["'][^>]*>/gi,
];

function extractEagerScriptSrcs(html) {
  const srcs = [];
  const patterns = [SCRIPT_SRC_PATTERN, ...MODULEPRELOAD_PATTERNS];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      srcs.push(match[1]);
    }
  }
  return [...new Set(srcs)];
}

function main() {
  const buildDir = findBuildDir();

  if (!buildDir) {
    console.error(
      `f4: no frontend build output found (checked ${CANDIDATE_BUILD_DIRS.join(
        ", "
      )}).`
    );
    console.error("f4: run `npm run build-frontend` before this check.");
    process.exit(1);
  }

  const indexHtmlPath = path.join(buildDir, "index.html");
  if (!fs.existsSync(indexHtmlPath)) {
    console.error(
      `f4: ${path.relative(REPO_ROOT, indexHtmlPath)} not found in the build output.`
    );
    process.exit(1);
  }

  const html = fs.readFileSync(indexHtmlPath, "utf8");
  const srcs = extractEagerScriptSrcs(html).filter((src) =>
    src.split("?")[0].endsWith(".js")
  );

  if (srcs.length === 0) {
    console.error(
      "f4: found no eagerly-loaded <script src=\"*.js\"> in the built index.html -- check extractEagerScriptSrcs()."
    );
    process.exit(1);
  }

  console.log(`f4: scanning ${path.relative(REPO_ROOT, buildDir)} for the initial JS bundle`);

  let totalGzipBytes = 0;
  const breakdown = [];

  for (const src of srcs) {
    // src is root-relative (e.g. "/assets/index-XXXX.js"); the build dir is
    // that root once deployed, so strip the leading slash and join.
    const relPath = src.replace(/^\/+/, "");
    const filePath = path.join(buildDir, relPath);
    if (!fs.existsSync(filePath)) {
      console.error(
        `f4: index.html references "${src}", but ${path.relative(REPO_ROOT, filePath)} does not exist.`
      );
      process.exit(1);
    }
    const raw = fs.readFileSync(filePath);
    const gzipBytes = zlib.gzipSync(raw, {
      level: zlib.constants.Z_BEST_COMPRESSION,
    }).length;
    totalGzipBytes += gzipBytes;
    breakdown.push(`  - ${relPath}: ${gzipBytes.toLocaleString()} bytes gzip`);
  }

  console.log(breakdown.join("\n"));
  console.log(
    `f4: total initial JS = ${totalGzipBytes.toLocaleString()} bytes gzip (ceiling ${CEILING_BYTES.toLocaleString()}).`
  );

  if (totalGzipBytes > CEILING_BYTES) {
    console.error(
      `f4 FAILED: initial JS bundle is ${totalGzipBytes.toLocaleString()} bytes gzip, over the ${CEILING_BYTES.toLocaleString()}-byte ceiling.`
    );
    console.error(
      "f4: trim what ships to the browser, or, if the growth is deliberate and reviewed, raise CEILING_BYTES in scripts/check-bundle-size.js with a comment explaining why."
    );
    process.exit(1);
  }

  console.log("f4: initial JS bundle is within the gzip ceiling. OK.");
}

main();
