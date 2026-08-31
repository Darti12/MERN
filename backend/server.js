require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const chatRoutes = require("./routes/chats");
const corsOptions = require("./config/corsOptions");
const cors = require("cors");

//express app
const app = express();
const port = process.env.PORT || 4000;

app.use(cors(corsOptions)); // Use this after the variable declaration

// Trust the first proxy hop (Render's reverse proxy) so req.ip reflects the
// real client address rather than the proxy's — required for the chat
// route's per-IP rate limit (routes/chats.js) to work correctly. See
// docs/architecture/adr/0002-chat-abuse-guard.md.
app.set("trust proxy", 1);

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// Health check — infrastructure only, deliberately outside /api.
//
// This reports LIVENESS, not readiness, and therefore always returns 200
// while the process is running. Render treats a non-2xx healthCheckPath as
// a failed deploy, and a transient Atlas outage should not tear down a
// service whose portfolio traffic never touches the database at all
// (ADR 0001). Database state is reported in the body instead, for humans
// and for uptime checks that want to distinguish the two.
const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    db: DB_STATES[mongoose.connection.readyState] ?? "unknown",
  });
});

// There is deliberately no app-wide `express.json()`. /api/chat applies its
// own bounded size cap as the first link of the abuse guard (see
// routes/chats.js and ADR 0002); a parser that already ran upstream would
// silently bypass that cap.
//
// `routeManifest` is the single source of truth for which router mounts
// where: the loop just below is the only place any router gets mounted, and
// this same manifest is what fitness function f3
// (backend/tests/security/routeAllowlist.test.js) walks to enumerate every
// live route and check it against backend/security/routeAllowlist.json.
//
// Since ADR 0005 the API is portfolio-only: the workouts, projects and user
// routers are gone, so /api/chat is the sole mount. Anything added here must
// also be declared in routeAllowlist.json or f3 fails the build — that is the
// point of the check (see risk r9 in model.json).
const routeManifest = {
  standalone: [{ method: "GET", path: "/health" }],
  mounts: [{ prefix: "/api/chat", router: chatRoutes }],
};

routeManifest.mounts.forEach(({ prefix, router }) => {
  app.use(prefix, router);
});

app.routeManifest = routeManifest;

module.exports = app;

// Only connect to Mongo and start listening when this file is run directly
// (`node server.js`), not when it's merely required. Fitness function f3
// requires this module to get the real, fully-mounted `app` and its
// `routeManifest` without opening a DB connection or a port.
// Fail fast rather than hang. Mongoose's defaults buffer a query for 10s and
// spend 30s selecting a server, so with the database down a chat request
// would sit open for ten seconds before the guard could refuse it, and the
// retry loop below would barely turn. Five seconds is long enough to ride
// out a blip and short enough that a refusal feels like a refusal.
mongoose.set("bufferTimeoutMS", 5000);

function connectWithRetry(attempt = 1) {
  mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(async () => {
      console.log("Connected to DB");
      // Report index state explicitly. The TTL index on chats and the unique
      // index on its token are load-bearing (data retention, and closing
      // transcript enumeration), but Mongoose builds them in the background
      // and swallows failures. Without this, a silently unbuilt index looks
      // exactly like a working one until transcripts never expire.
      try {
        const Chat = require("./models/ChatModel");
        const indexes = await Chat.collection.indexes();
        const names = indexes.map((i) => i.name).join(", ");
        const hasTtl = indexes.some((i) => i.expireAfterSeconds !== undefined);
        console.log(`Chat indexes: ${names} (TTL present: ${hasTtl})`);
        if (!hasTtl) {
          console.error(
            "WARNING: no TTL index on chats — transcripts will accumulate indefinitely."
          );
        }
      } catch (err) {
        console.error("Could not read chat indexes:", err.message);
      }
    })
    .catch((error) => {
      // Exponential backoff, capped at 30s. A free-tier Atlas cluster can be
      // slow to accept the first connection; retrying beats requiring a
      // redeploy to recover from a cold database.
      const delay = Math.min(30000, 1000 * 2 ** (attempt - 1));
      console.error(
        `Mongo connection attempt ${attempt} failed, retrying in ${delay}ms:`,
        error.message
      );
      setTimeout(() => connectWithRetry(attempt + 1), delay);
    });
}

if (require.main === module) {
  // Open the port FIRST, before the database is reachable. /health must be
  // answerable even when Mongo is down: previously app.listen sat inside
  // mongoose.connect().then(), so a database that was merely slow meant the
  // port never opened, the healthcheck never answered, and the deploy was
  // marked failed. Liveness is the process being up; database state is
  // reported by /health rather than gating it.
  app.listen(port, () => {
    console.log("Listening on port", port);
  });

  connectWithRetry();
}
