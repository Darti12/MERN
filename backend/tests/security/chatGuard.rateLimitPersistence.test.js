// Fitness function f1, part 3 (ADR 0002, amendment 3): the per-IP rate limit
// must SURVIVE A PROCESS RESTART.
//
// This API is scale-to-zero on Render's free tier, so the process is torn down
// after minutes of idleness. With express-rate-limit's default in-memory
// store, "20 requests per IP per day" silently meant "20 per process
// lifetime" — a limit that resets every few minutes is not a limit.
//
// A restart is simulated by building a second limiter with its OWN store
// instance, mounted on its own app. The two share nothing in process memory;
// the only thing they have in common is the database. If the count carries
// over, the counter is genuinely persistent.
//
// Note: this deliberately does NOT use jest.resetModules() to simulate the
// restart. That would invalidate the mongoose connection opened once in
// tests/setup.js, and the test would fail on a buffering timeout rather than
// on the property under test.

const express = require("express");
const request = require("supertest");
const rateLimit = require("express-rate-limit");
const MongoRateLimitStore = require("../../middleware/mongoRateLimitStore");
const RateLimit = require("../../models/RateLimitModel");

const LIMIT = 3;

// Mirrors the limiter constructed in routes/chats.js, with a fresh store — as
// a newly started process would have.
function freshProcess() {
  const app = express();
  app.use(
    rateLimit({
      windowMs: 24 * 60 * 60 * 1000,
      limit: LIMIT,
      standardHeaders: true,
      legacyHeaders: false,
      store: new MongoRateLimitStore(),
      message: { error: "Too many chat requests from this IP today." },
    }),
    (req, res) => res.status(200).json({ ok: true })
  );
  return app;
}

describe("Chat rate limit persistence (fitness function f1)", () => {
  beforeEach(async () => {
    await RateLimit.deleteMany({});
  });

  it("carries the per-IP count across a simulated process restart", async () => {
    const before = freshProcess();

    for (let i = 0; i < LIMIT; i++) {
      const res = await request(before).get("/");
      expect(res.status).toBe(200);
    }

    // Restart: new limiter, new store, nothing shared but the database.
    const after = freshProcess();

    const res = await request(after).get("/");

    // With the default MemoryStore this was a fresh allowance and returned 200.
    expect(res.status).toBe(429);
  });

  it("starts a new window once the old one has expired", async () => {
    const app = freshProcess();
    await request(app).get("/");

    // Age the stored window out rather than waiting 24h for it.
    await RateLimit.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await request(app).get("/");
    expect(res.status).toBe(200);

    const doc = await RateLimit.findOne({});
    expect(doc.hits).toBe(1); // counted as the first hit of a fresh window
  });
});
