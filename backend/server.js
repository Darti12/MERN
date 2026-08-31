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

// health check — infrastructure only, deliberately outside /api
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
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
if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      // listen for requests
      app.listen(port, () => {
        console.log("Connected to DB & listening on port", port);
      });
    })
    .catch((error) => {
      console.log(error);
    });
}
