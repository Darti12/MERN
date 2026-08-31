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

// NOTE: there used to be a single app-wide `express.json()` here. It has
// been removed in favor of per-route body parsing: /api/chat applies its
// own bounded size cap as part of the abuse guard (see routes/chats.js and
// ADR 0002). Since ADR 0005 this is also the only route mounted — the
// private app (workouts, projects, user/auth) was deleted rather than left
// dormant behind this parser.
//routes
app.use("/api/chat", chatRoutes);

// connect to db
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
