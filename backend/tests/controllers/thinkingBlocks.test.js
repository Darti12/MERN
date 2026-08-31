// claude-sonnet-5 runs adaptive thinking by default, so a reply to anything
// non-trivial arrives as [thinking, text], not [text]. Thinking display
// defaults to omitted, so that leading block carries an EMPTY string.
//
// This broke the UI in a way that only showed up on interesting questions:
// ChatBubble read content[0].text, got undefined, and rendered an empty
// bubble — while the network tab plainly showed the reply had arrived. It
// also meant an empty thinking block was replayed to the API on the next turn.
//
// The controller now drops non-text blocks at the boundary. This pins that.

process.env.CHAT_RATE_LIMIT_MAX = "1000";
process.env.CHAT_DAILY_TOKEN_CEILING = "100000000";

const mockStream = jest.fn().mockReturnValue({
  on: jest.fn().mockReturnThis(),
  finalMessage: jest.fn().mockResolvedValue({
    role: "assistant",
    content: [
      { type: "thinking", thinking: "" }, // what actually comes back
      { type: "text", text: "The real answer." },
    ],
    usage: { input_tokens: 5, output_tokens: 5 },
  }),
});

jest.mock("@anthropic-ai/sdk", () =>
  jest.fn().mockImplementation(() => ({ messages: { stream: mockStream } }))
);

const express = require("express");
const request = require("supertest");
const chatRoutes = require("../../routes/chats");

const app = express();
app.use("/api/chat", chatRoutes);

describe("assistant replies containing thinking blocks", () => {
  it("persists only the text block, so the UI never sees an empty first block", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }] });

    const done = res.text
      .split("\n")
      .filter((l) => l.startsWith("data: "))
      .map((l) => JSON.parse(l.slice(6)))
      .find((e) => e.type === "done");

    expect(done).toBeDefined();
    const assistant = done.chat.messages[done.chat.messages.length - 1];

    expect(assistant.content.map((b) => b.type)).toEqual(["text"]);
    expect(assistant.content[0].text).toBe("The real answer.");
    // The specific regression: the first block must be renderable.
    expect(assistant.content[0].text).not.toBeUndefined();
  });
});
