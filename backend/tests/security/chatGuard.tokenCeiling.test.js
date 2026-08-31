// Fitness function f1, part 2 (docs/architecture/README.md, section 11):
// the daily token spend ceiling on /api/chat (ADR 0002) must reject BEFORE
// any billable Anthropic call, not after -- "a guard that rejects after
// paying is not a guard." With today's persisted usage counter already at
// its ceiling, asserts the next request is rejected with 429 AND that the
// stubbed Anthropic client recorded ZERO calls. That second assertion is
// the whole point of this test.
//
// A second case asserts the guard FAILS CLOSED: when the usage counter
// cannot be read at all, the request is refused rather than allowed
// through unmetered.
//
// Kept in its own file (see chatGuard.rateLimit.test.js for why) so this
// check's small CHAT_DAILY_TOKEN_CEILING can't interact with the rate
// limit test's own env config.

process.env.CHAT_RATE_LIMIT_MAX = "1000000"; // isolate this test to the ceiling alone
process.env.CHAT_RATE_LIMIT_WINDOW_MS = String(24 * 60 * 60 * 1000);
process.env.CHAT_DAILY_TOKEN_CEILING = "100";
process.env.CHAT_BODY_LIMIT = "16kb";

// Stubs the Anthropic call (@anthropic-ai/sdk's client.messages.stream, per
// backend/controllers/chatController.js's sendMessageToClaude — see ADR
// 0004). Its call count is the assertion this whole test exists for.
// mockStream stands in for the MessageStream the real SDK returns.
const mockStream = jest.fn().mockReturnValue({
  on: jest.fn().mockReturnThis(),
  finalMessage: jest.fn().mockResolvedValue({
    role: "assistant",
    content: [{ type: "text", text: "Hi there." }],
    usage: { input_tokens: 10, output_tokens: 10 },
  }),
});

jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: { stream: mockStream },
  }));
});

const express = require("express");
const request = require("supertest");
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
    expect(mockStream).not.toHaveBeenCalled();
  });

  it("FAILS CLOSED with 503 and makes ZERO Anthropic calls when the counter cannot be read", async () => {
    // A cost control that fails open is not a cost control. If the usage
    // counter is unreadable we cannot know what has been spent today, so we
    // must not spend more -- and this is exactly the situation in which
    // nobody is watching. Since server.js now opens its port before Mongo
    // connects, a database outage no longer keeps traffic away from this
    // middleware by accident, so this path is reachable in production.
    const findOne = jest
      .spyOn(Usage, "findOne")
      .mockRejectedValueOnce(new Error("simulated database outage"));

    try {
      const res = await request(app).post("/api/chat").send(chatPayload());

      // 503, not 429: the budget is not known to be exhausted; we are
      // temporarily unable to verify it.
      expect(res.status).toBe(503);
      expect(mockStream).not.toHaveBeenCalled();
    } finally {
      findOne.mockRestore();
    }
  });
});
