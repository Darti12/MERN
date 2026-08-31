const mongoose = require("mongoose");

// Persisted counter for the per-IP chat rate limit (ADR 0002).
//
// express-rate-limit's default store is in-memory, which is useless on a
// scale-to-zero free-tier service: the process is torn down after ~15 minutes
// idle, so "20 requests per IP per day" silently degraded to "20 per process
// lifetime". Keeping the counter in Mongo — where the daily token ceiling
// already lives — makes the window mean what ADR 0002 says it means.
const rateLimitSchema = new mongoose.Schema(
  {
    // The rate-limit key. express-rate-limit passes the client IP by default.
    key: { type: String, required: true, unique: true },
    hits: { type: Number, required: true, default: 0 },
    // End of the current window. Also drives the TTL below, so expired
    // counters are reaped by MongoDB rather than accumulating forever.
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RateLimit", rateLimitSchema);
