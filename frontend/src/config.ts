// Single source of truth for runtime configuration that reaches the browser.
//
// Centralised deliberately. The Create React App -> Vite migration (ADR 0003)
// changes how environment variables are exposed to the bundle
// (`process.env.REACT_APP_*` becomes `import.meta.env.VITE_*`), and this is
// the only file that has to change when it does.
//
// SECURITY: only ever read variables that are safe to ship to a browser.
// ANTHROPIC_API_KEY and anything like it is server-side only (ADR 0002) and
// must never be referenced from frontend/. Fitness function f2 fails the build
// if a secret reaches the built bundle.

const rawApiBaseUrl = process.env.REACT_APP_API_URL;

if (!rawApiBaseUrl && process.env.NODE_ENV !== "test") {
  // Deliberately a warning, not a throw. Under ADR 0001 the portfolio must
  // render even when the API is misconfigured or unreachable — only the chat
  // page depends on it, and it degrades to a visible offline state.
  // eslint-disable-next-line no-console
  console.warn(
    "REACT_APP_API_URL is not set. The portfolio will render normally; the chat page will show as offline."
  );
}

/** Absolute origin of the API, with any trailing slashes removed. */
export const API_BASE_URL = (rawApiBaseUrl ?? "").replace(/\/+$/, "");

/** False when no API URL was configured at build time. */
export const isApiConfigured = Boolean(rawApiBaseUrl);

/** Infrastructure healthcheck, used by the chat page's warming indicator. */
export const HEALTH_URL = `${API_BASE_URL}/health`;

/** Base URL for the chat API. The only API surface the SPA calls. */
export const CHAT_API_BASE_URL = `${API_BASE_URL}/api/chat`;
