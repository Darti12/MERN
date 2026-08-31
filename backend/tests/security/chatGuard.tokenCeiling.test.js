// Fitness function f1, part 2 (docs/architecture/README.md, section 11):
// the daily token spend ceiling on /api/chat (ADR 0002) must reject BEFORE
// any billable Anthropic call, not after -- "a guard that rejects after
// paying is not a guard." With today's persisted usage counter already at
// its ceiling, asserts the next request is rejected with 429 AND that the
// stubbed Anthropic client recorded ZERO calls. That second assertion is
// the whole point of this test.
//
// Kept in its own file (see chatGuard.rateLimit.test.js for why) so this
// check's small CHAT_DAILY_TOKEN_CEILING can't interact with the rate
// limit test's own env config.

process.env.CHAT_RATE_LIMIT_MAX = "1000000"; // isolate this test to the ceiling alone
process.env.CHAT_RATE_LIMIT_WINDOW_MS = String(24 * 60 * 60 * 1000);
process.env.CHAT_DAILY_TOKEN_CEILING = "100";
process.env.CHAT_BODY_LIMIT = "16kb";

// Stubs the Anthropic call (axios.post, per
// backend/controllers/chatController.js's sendMessageToClaude). Its call
// count is the assertion this whole test exists for.
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
const { todayUTC } = require("../../middleware/tokenCeiling");
const Usage = require("../../models/UsageModel");
const chatRoutes = require("../../routes/chats");

const app = express();
app.use("/api/chat", chatRoutes);

function chatPayload() {
  return {
    messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
  };
}

describe("Chat abuse guard: daily token spend ceiling (fitness function f1)", () => {
  it("rejects with 429 and makes ZERO Anthropic calls once the ceiling is already reached", async () => {
    // Seed today's persisted counter AT the ceiling, simulating a day that
    // has already spent its full budget.
    await Usage.create({ date: todayUTC(), tokensUsed: 100 });

    const res = await request(app).post("/api/chat").send(chatPayload());

    expect(res.status).toBe(429);
    // The point of this fitness function: the guard must reject BEFORE any
    // billable call, not after. Zero calls, not "one that got billed and
    // then apologized for." See ADR 0002.
    expect(axios.post).not.toHaveBeenCalled();
  });
});
