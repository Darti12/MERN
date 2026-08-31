const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// One document per UTC calendar day. `date` is a "YYYY-MM-DD" string so the
// counter resets naturally at UTC midnight with no cron job needed. Persisted
// in MongoDB (rather than in-process memory) so a Render restart/redeploy
// does not silently reset an abuser's spend back to zero.
// See docs/architecture/adr/0002-chat-abuse-guard.md.
const usageSchema = new Schema(
  {
    date: { type: String, required: true, unique: true },
    tokensUsed: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Usage", usageSchema);
