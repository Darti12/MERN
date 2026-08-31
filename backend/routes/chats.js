const express = require("express");
const rateLimit = require("express-rate-limit");
const Chat = require("../models/ChatModel");
const {
  createChat,
  getChat,
  getChats,
  deleteChat,
  updateChat,
} = require("../controllers/chatController");
const { checkTokenCeiling } = require("../middleware/tokenCeiling");

const router = express.Router();

// No auth middleware here by design: /api/chat is deliberately
// unauthenticated (ADR 0002). requireAuth and the rest of the private app
// were removed entirely rather than left commented out (ADR 0005) —
// exposure is now governed by the explicit route allowlist fitness
// function f3 checks against.

// --- Abuse guard (ADR 0002) ---
// POST /api/chat is unauthenticated by design (identity is unavailable as an
// abuse control — see the ADR), so it is protected by an ordered middleware
// chain instead. All three controls below must run BEFORE any billable
// Anthropic call:
//   1. Bounded request body size (replaces the app-wide express.json()).
//   2. Per-IP rate limit.
//   3. Global daily token-spend ceiling (checkTokenCeiling, applied per-route
//      below since it only matters for the routes that call Anthropic).

// 1. Request body size cap, scoped to this router only.
router.use(express.json({ limit: process.env.CHAT_BODY_LIMIT || "16kb" }));

// 2. Per-IP rate limit. Default: 20 requests/IP/24h — generous for a genuine
// visitor (a real conversation is closer to 5 messages) but bounds any
// single caller's volume. Configurable via env vars.
const chatRateLimiter = rateLimit({
  windowMs:
    Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS) || 24 * 60 * 60 * 1000, // 24h
  limit: Number(process.env.CHAT_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many chat requests from this IP today. Please try again tomorrow.",
  },
});

//GET all projects
router.get("/", getChats);

//GET a single project
router.get("/:id", getChat);

//POST a new project
// 3. Token ceiling check runs last, immediately before the controller that
// calls Anthropic.
router.post("/", chatRateLimiter, checkTokenCeiling, createChat);

//DELETE a project
router.delete("/:id", deleteChat);

//UPDATE a project
// updateChat also calls sendMessageToClaude, so it gets the same guard.
router.patch("/:id", chatRateLimiter, checkTokenCeiling, updateChat);

module.exports = router;
