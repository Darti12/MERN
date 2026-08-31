// Fitness function f3 (docs/architecture/README.md, section 11): every
// mounted Express route must appear on a checked-in allowlist declaring it
// "public" or "protected". A newly added route -- or a route whose actual
// requireAuth exposure drifts from what the allowlist says -- fails this
// test until someone declares it deliberately.
//
// This exists because the whole architecture-hardening run traces back to
// two commented-out lines in routes/chats.js (`const requireAuth = ...` and
// `router.use(requireAuth)`) that nothing noticed. See ADR 0002.
//
// This test does NOT hand-list routes itself. It requires the real,
// fully-mounted app from server.js and walks each router's own `.stack` --
// the actual data structure Express dispatches requests against -- so a
// route added to (or an auth line removed from) any routes/*.js file is
// picked up automatically, with no separate manifest to forget to update.

const app = require("../../server");
const requireAuth = require("../../middleware/requireAuth");
const allowlist = require("../../security/routeAllowlist.json");

function keyOf(method, path) {
  return `${String(method).toUpperCase()} ${path}`;
}

function joinPath(prefix, subPath) {
  return subPath === "/" ? prefix : `${prefix}${subPath}`;
}

// Walk one router's own stack and return every VERB route it defines, along
// with whether `requireAuth` had been `router.use()`d before that route was
// declared. This mirrors Express's real dispatch order: middleware added
// via `.use()` applies to every route registered after it, in the order
// they were registered -- so this is not a heuristic, it is the same
// ordering Express itself relies on.
function enumerateRouterRoutes(prefix, router) {
  const routes = [];
  let authApplied = false;

  for (const layer of router.stack) {
    if (!layer.route) {
      // A `.use()` layer (e.g. `router.use(requireAuth)` or
      // `router.use(express.json())`). Only requireAuth, matched by
      // reference, changes exposure.
      if (layer.handle === requireAuth) {
        authApplied = true;
      }
      continue;
    }

    const path = joinPath(prefix, layer.route.path);
    for (const method of Object.keys(layer.route.methods)) {
      if (method === "_all") continue;
      routes.push({
        method: method.toUpperCase(),
        path,
        exposure: authApplied ? "protected" : "public",
      });
    }
  }

  return routes;
}

describe("Route exposure allowlist (fitness function f3)", () => {
  it("exposes a routeManifest on the app for this check to walk", () => {
    expect(app.routeManifest).toBeDefined();
    expect(Array.isArray(app.routeManifest.standalone)).toBe(true);
    expect(Array.isArray(app.routeManifest.mounts)).toBe(true);
    expect(app.routeManifest.mounts.length).toBeGreaterThan(0);
  });

  it("declares an exposure for every mounted route, matching reality", () => {
    const manifest = app.routeManifest;

    const actual = manifest.standalone.map((r) => ({
      method: r.method,
      path: r.path,
      // Routes declared directly on the app (currently only /health) have
      // no requireAuth concept; they are public by construction.
      exposure: "public",
    }));

    for (const { prefix, router } of manifest.mounts) {
      actual.push(...enumerateRouterRoutes(prefix, router));
    }

    const allowlistByKey = new Map(
      allowlist.map((entry) => [keyOf(entry.method, entry.path), entry])
    );
    const actualByKey = new Map(
      actual.map((entry) => [keyOf(entry.method, entry.path), entry])
    );

    // A route that exists but has no allowlist entry: the case this fitness
    // function exists for.
    const undeclared = actual.filter(
      (r) => !allowlistByKey.has(keyOf(r.method, r.path))
    );

    // An allowlist entry with no matching route: keeps the file from
    // silently accumulating dead declarations that make it lie by omission
    // about what's actually exposed.
    const stale = allowlist.filter(
      (r) => !actualByKey.has(keyOf(r.method, r.path))
    );

    // A route whose declared exposure no longer matches what the code
    // actually does -- e.g. a `router.use(requireAuth)` line got deleted
    // and the allowlist still says "protected".
    const mismatched = actual
      .filter((r) => {
        const declared = allowlistByKey.get(keyOf(r.method, r.path));
        return declared && declared.exposure !== r.exposure;
      })
      .map((r) => {
        const declared = allowlistByKey.get(keyOf(r.method, r.path));
        return `${keyOf(r.method, r.path)}: actually "${r.exposure}", allowlist says "${declared.exposure}"`;
      });

    if (undeclared.length > 0) {
      throw new Error(
        `Route(s) not declared in backend/security/routeAllowlist.json: ` +
          `${undeclared.map((r) => keyOf(r.method, r.path)).join(", ")}. ` +
          `Add an entry declaring "public" or "protected" before merging.`
      );
    }

    if (stale.length > 0) {
      throw new Error(
        `backend/security/routeAllowlist.json has entries for routes that ` +
          `no longer exist: ${stale
            .map((r) => keyOf(r.method, r.path))
            .join(", ")}. Remove them or fix the path.`
      );
    }

    if (mismatched.length > 0) {
      throw new Error(
        `Route exposure does not match backend/security/routeAllowlist.json: ` +
          mismatched.join("; ")
      );
    }

    expect(undeclared).toEqual([]);
    expect(stale).toEqual([]);
    expect(mismatched).toEqual([]);
  });
});
