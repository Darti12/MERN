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

//middleware
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// health check — infrastructure only, deliberately outside /api
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

//routes
app.use("/api/workouts", workoutRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/user", userRoutes);
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
