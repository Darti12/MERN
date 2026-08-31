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

// NOTE: there used to be a single app-wide `express.json()` here. It has
// been removed in favor of per-route body parsing: /api/chat applies its
// own bounded size cap as part of the abuse guard (see routes/chats.js and
// ADR 0002), and the remaining routes get an ordinary parser scoped to
// their own mount so the chat route's cap can't be bypassed by a parser
// that already ran upstream.
//routes
app.use("/api/workouts", express.json(), workoutRoutes);
app.use("/api/projects", express.json(), projectRoutes);
app.use("/api/user", express.json(), userRoutes);
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
