const express = require("express");
const Chat = require("../models/ChatModel");
const {
  createChat,
  getChat,
  getChats,
  deleteChat,
  updateChat,
} = require("../controllers/chatController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

//middleware for authentication
//router.use(requireAuth);

//GET all projects
router.get("/", getChats);

//GET a single project
router.get("/:id", getChat);

//POST a new project
router.post("/", createChat);

//DELETE a project
router.delete("/:id", deleteChat);

//UPDATE a project
router.patch("/:id", updateChat);

module.exports = router;
