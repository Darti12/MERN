const express = require("express");
const rateLimit = require("express-rate-limit");
const Chat = require("../models/ChatModel");
const {
  createChat,
  getChat,
  deleteChat,
  updateChat,
} = require("../controllers/chatController");
const { checkTokenCeiling } = require("../middleware/tokenCeiling");
const MongoRateLimitStore = require("../middleware/mongoRateLimitStore");

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
  // Persisted in Mongo, NOT in memory. This API is scale-to-zero, so the
  // default MemoryStore reset on every cold start and the daily window was
  // effectively unenforced. See ADR 0002, amendment 3.
  store: new MongoRateLimitStore(),
  message: {
    error: "Too many chat requests from this IP today. Please try again tomorrow.",
  },
});

// If the store itself fails — Mongo unreachable — express-rate-limit
// propagates the error rather than letting the request through. That is the
// behaviour we want (fail closed, exactly as the token ceiling does), but
// unhandled it surfaces as a 500. This maps it to the same 503 the ceiling
// returns, so a visitor sees one consistent "temporarily unavailable" rather
// than two different failures for the same underlying cause.
function chatGuardErrorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  console.error("Chat guard failure, refusing to spend:", err);
  res.status(503).json({
    error: "Chat is temporarily unavailable. Please try again shortly.",
  });
}

// No list-all-chats route: chat is anonymous by constraint (ADR 0002), so
// there is no ownership model to list against. A transcript is only ever
// reached individually, by its high-entropy token (see ChatModel.js).

//GET a single chat, by token
router.get("/:id", getChat);

//POST a new chat message
// 3. Token ceiling check runs last, immediately before the controller that
// calls Anthropic.
router.post("/", chatRateLimiter, checkTokenCeiling, createChat);

//DELETE a chat, by token
router.delete("/:id", deleteChat);

//UPDATE a chat, by token
// updateChat also calls sendMessageToClaude, so it gets the same guard.
router.patch("/:id", chatRateLimiter, checkTokenCeiling, updateChat);

// Mounted last so it only catches failures from this router's guard chain.
router.use(chatGuardErrorHandler);

module.exports = router;
