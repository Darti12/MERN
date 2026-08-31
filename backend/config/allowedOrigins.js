// Origins permitted to call this API.
//
// Since ADR 0001 the SPA is served as static assets from a different origin
// than the API, so CORS is real configuration rather than something
// same-origin hosting quietly hid. STATIC_SITE_URL is the static host's
// origin (the Render Static Site or Cloudflare Pages URL); APP_URL is kept
// for the existing deployment.
//
// .filter(Boolean) matters: an unset env var would otherwise put `undefined`
// into the array, which corsOptions would then happily match against.
const allowedOrigins = [
  process.env.APP_URL,
  process.env.STATIC_SITE_URL,
  "https://www.filiphagen.com",
  "https://filiphagen.com",
].filter(Boolean);

module.exports = allowedOrigins;
