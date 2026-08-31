const RateLimit = require("../models/RateLimitModel");

// A persistent express-rate-limit store backed by MongoDB.
//
// Implements the Store interface: init(options), increment(key),
// decrement(key), resetKey(key).
//
// Why this exists: the default MemoryStore resets whenever the process
// restarts, and this API is scale-to-zero on Render's free tier, so it
// restarts constantly. The per-IP limit was effectively unenforced between
// cold starts. See ADR 0002, amendment 3.
class MongoRateLimitStore {
  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const now = new Date();

    // Drop a stale window first so the upsert below starts a fresh one with a
    // correct expiry. Doing it as its own operation keeps the upsert simple
    // and avoids a duplicate-key race on the unique `key` index.
    await RateLimit.deleteOne({ key, expiresAt: { $lte: now } });

    const doc = await RateLimit.findOneAndUpdate(
      { key },
      {
        $inc: { hits: 1 },
        $setOnInsert: {
          key,
          expiresAt: new Date(now.getTime() + this.windowMs),
        },
      },
      { new: true, upsert: true }
    );

    return { totalHits: doc.hits, resetTime: doc.expiresAt };
  }

  async decrement(key) {
    await RateLimit.updateOne(
      { key, hits: { $gt: 0 } },
      { $inc: { hits: -1 } }
    );
  }

  async resetKey(key) {
    await RateLimit.deleteOne({ key });
  }
}

module.exports = MongoRateLimitStore;
