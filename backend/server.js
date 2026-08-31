require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const workoutRoutes = require("./routes/workouts");
const projectRoutes = require("./routes/projects");
const userRoutes = require("./routes/user");
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

// NOTE: there used to be a single app-wide `express.json()` here. It has
// been removed in favor of per-route body parsing: /api/chat applies its
// own bounded size cap as part of the abuse guard (see routes/chats.js and
// ADR 0002), and the remaining routes get an ordinary parser scoped to
// their own mount so the chat route's cap can't be bypassed by a parser
// that already ran upstream.
//
// `routeManifest` is the single source of truth for which router mounts
// where: the loop just below is the only place any of these routers get
// mounted, and this same manifest is what fitness function f3
// (backend/tests/security/routeAllowlist.test.js) walks to enumerate every
// live route and check it against backend/security/routeAllowlist.json.
// There is no separate hand-maintained list to fall out of sync with the
// mounting code, only with the routers themselves -- and those are
// introspected live, not hand-copied. See docs/architecture/adr/0002.
const routeManifest = {
  standalone: [{ method: "GET", path: "/health" }],
  mounts: [
    { prefix: "/api/workouts", router: workoutRoutes },
    { prefix: "/api/projects", router: projectRoutes },
    { prefix: "/api/user", router: userRoutes },
    // /api/chat applies its own body parser (see routes/chats.js), so it is
    // mounted without the shared express.json() the other three get.
    { prefix: "/api/chat", router: chatRoutes },
  ],
};

routeManifest.mounts.forEach(({ prefix, router }) => {
  if (prefix === "/api/chat") {
    app.use(prefix, router);
  } else {
    app.use(prefix, express.json(), router);
  }
});

app.routeManifest = routeManifest;

module.exports = app;

// Only connect to Mongo and start listening when this file is run directly
// (`node server.js` / `npm start`), not when it's merely required. Fitness
// function f3 requires this module to get the real, fully-mounted `app` and
// its `routeManifest` without opening a DB connection or a port.
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
