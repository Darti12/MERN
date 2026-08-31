// Fitness function f1, part 1 (docs/architecture/README.md, section 11):
// the per-IP rate limit on /api/chat (ADR 0002) must actually reject
// traffic once a caller exceeds its allowance, not just exist in the
// source. Fires N+1 requests at /api/chat from one IP and asserts the last
// one returns 429.
//
// This is a separate test FILE (rather than a second case sharing a file
// with the token-ceiling check below) so that Jest's normal per-file module
// isolation gives each check its own fresh rate limiter / mongoose
// connection, without needing jest.resetModules() -- which would also blow
// away the mongoose singleton this file's tests/setup.js connected.
//
// CHAT_RATE_LIMIT_MAX must be set before routes/chats.js is required: its
// rate limiter is constructed once, at module load, from the env var.

process.env.CHAT_RATE_LIMIT_MAX = "3";
process.env.CHAT_RATE_LIMIT_WINDOW_MS = String(24 * 60 * 60 * 1000);
// High enough that the token ceiling never fires here -- this test is
// isolated to the rate limiter alone.
process.env.CHAT_DAILY_TOKEN_CEILING = "1000000";
process.env.CHAT_BODY_LIMIT = "16kb";

const RATE_LIMIT_MAX = Number(process.env.CHAT_RATE_LIMIT_MAX);

// Stubs the Anthropic call (axios.post, per
// backend/controllers/chatController.js's sendMessageToClaude) so this test
// makes no real, billable network call, and so its call count can be
// asserted on directly.
jest.mock("axios", () => ({
  post: jest.fn().mockResolvedValue({
    data: {
      role: "assistant",
      content: [{ type: "text", text: "Hi there." }],
      usage: { input_tokens: 10, output_tokens: 10 },
    },
  }),
}));

const express = require("express");
const request = require("supertest");
const axios = require("axios");
const chatRoutes = require("../../routes/chats");

const app = express();
app.use("/api/chat", chatRoutes);

function chatPayload() {
  return {
    messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
  };
}

describe("Chat abuse guard: per-IP rate limit (fitness function f1)", () => {
  it(`allows ${RATE_LIMIT_MAX} requests from one IP, then returns 429 on the (N+1)th`, async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const res = await request(app).post("/api/chat").send(chatPayload());
      expect(res.status).not.toBe(429);
    }

    const finalRes = await request(app)
      .post("/api/chat")
      .send(chatPayload());
    expect(finalRes.status).toBe(429);

    // Sanity check: the allowed requests really did reach the Anthropic
    // client, so the 429 above is the rate limiter doing its job, not some
    // unrelated failure that happens to share a status code.
    expect(axios.post).toHaveBeenCalledTimes(RATE_LIMIT_MAX);
  });
});
