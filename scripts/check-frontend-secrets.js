#!/usr/bin/env node
"use strict";

// Fitness function f2 (docs/architecture/README.md, section 11): the built
// frontend must never contain the Anthropic API key or anything shaped like
// a secret. ANTHROPIC_API_KEY is server-side only (backend/controllers/chatController.js) --
// there is no legitimate reason the string "ANTHROPIC" or a key-shaped
// literal should ever appear in the client bundle.
//
// This specifically guards against the CRA -> Vite migration described in
// ADR 0003: CRA inlines any REACT_APP_* env var into the bundle at build
// time, Vite inlines any VITE_* var, and the two inlining rules differ --
// which is exactly the mechanism by which a stray/miscopied env var
// assignment could ship a real key to every visitor's browser (risk r3).
//
// Run after `npm run build-frontend`:
//   node scripts/check-frontend-secrets.js
//
// Exits non-zero (failing the CI step) if it finds anything.

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");

// Vite (frontend/vite.config.ts, ADR 0003) is configured to output to
// frontend/build, matching what render.yaml's staticPublishPath already
// expected from the CRA era, so no infra config had to change. frontend/dist
// -- Vite's own default -- is kept as a fallback in case that build.outDir
// setting is ever removed.
const CANDIDATE_BUILD_DIRS = ["frontend/build", "frontend/dist"];

// Extensions that are binary/opaque and never worth scanning as text --
// scanning them either can't reveal a leaked secret (fonts, media) or is
// certain to trip the base64-ish check on unrelated embedded binary data.
const SKIP_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".webp",
  ".avif",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".mp4",
  ".webm",
  ".mp3",
  ".wasm",
]);

// Anthropic's own key prefix, plus a generic long base64-ish run to catch a
// key issued under a different prefix or scheme.
const SK_ANT_PATTERN = /sk-ant-[A-Za-z0-9_-]{20,}/;
const LONG_BASE64_PATTERN = /[A-Za-z0-9+/]{80,}={0,2}/;

// Anything shaped like a data: URI (embedded images/fonts) is legitimate
// build output, not a secret, however long its base64 payload is. Strip
// these out before running the base64-ish check so they can't trigger a
// false positive.
const DATA_URI_PATTERN = /data:[a-zA-Z0-9.+/-]+;base64,[A-Za-z0-9+/=]+/g;

function findBuildDir() {
  for (const candidate of CANDIDATE_BUILD_DIRS) {
    const full = path.join(REPO_ROOT, candidate);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      return full;
    }
  }
  return null;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  const buildDir = findBuildDir();

  if (!buildDir) {
    console.error(
      `f2: no frontend build output found (checked ${CANDIDATE_BUILD_DIRS.join(
        ", "
      )}).`
    );
    console.error("f2: run `npm run build-frontend` before this check.");
    process.exit(1);
  }

  console.log(`f2: scanning ${path.relative(REPO_ROOT, buildDir)} for leaked secrets`);

  const findings = [];

  for (const file of walk(buildDir)) {
    const ext = path.extname(file).toLowerCase();
    if (SKIP_EXTENSIONS.has(ext)) continue;

    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch (err) {
      // Not readable as text (e.g. an unlisted binary extension) -- skip
      // rather than false-positive on garbage bytes.
      continue;
    }

    const relPath = path.relative(REPO_ROOT, file);

    if (content.includes("ANTHROPIC")) {
      findings.push(
        `${relPath}: contains the string "ANTHROPIC" -- should never appear client-side`
      );
    }

    const skAntMatch = content.match(SK_ANT_PATTERN);
    if (skAntMatch) {
      findings.push(
        `${relPath}: contains an sk-ant- prefixed key-shaped literal`
      );
    }

    // Source maps' "mappings" field is itself one enormous VLQ-encoded
    // base64-ish blob by design -- excluded from this check only, not from
    // the ANTHROPIC string check above (sourcesContent can still leak
    // source text).
    if (ext !== ".map") {
      const withoutDataUris = content.replace(DATA_URI_PATTERN, "");
      if (LONG_BASE64_PATTERN.test(withoutDataUris)) {
        findings.push(
          `${relPath}: contains a long base64-ish literal (possible leaked secret)`
        );
      }
    }
  }

  if (findings.length > 0) {
    console.error("f2 FAILED: possible secrets found in the built frontend:");
    for (const finding of findings) {
      console.error(`  - ${finding}`);
    }
    console.error("f2: do not ship this build.");
    process.exit(1);
  }

  console.log("f2: no secrets found. OK.");
}

main();
