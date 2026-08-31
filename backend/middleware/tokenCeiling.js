const Usage = require("../models/UsageModel");

// Approximate default: 300,000 tokens/day is roughly $4.50 at Claude 3.7
// Sonnet's $15/MTok *output* rate — the worst case if every token were an
// output token. In practice most tokens spent by this app are the cheaper
// $3/MTok input/system-prompt tokens, so real spend at this ceiling is
// typically well under $5/day. Override with CHAT_DAILY_TOKEN_CEILING once
// real usage patterns are known. See docs/architecture/adr/0002-chat-abuse-guard.md.
const DEFAULT_DAILY_TOKEN_CEILING = 300000;

function todayUTC() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getCeiling() {
  const configured = Number(process.env.CHAT_DAILY_TOKEN_CEILING);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_DAILY_TOKEN_CEILING;
}

// Middleware: rejects the request with 429 BEFORE any Anthropic call if
// today's persisted token counter has already reached the configured
// ceiling. Must be mounted before the controller that calls
// sendMessageToClaude — see ADR 0002: "a guard that rejects after paying is
// not a guard."
async function checkTokenCeiling(req, res, next) {
  try {
    const date = todayUTC();
    const ceiling = getCeiling();
    const usage = await Usage.findOne({ date });

    if (usage && usage.tokensUsed >= ceiling) {
      return res.status(429).json({
        error: "Daily chat budget reached. Please try again after midnight UTC.",
      });
    }

    next();
  } catch (error) {
    // FAIL CLOSED. This is a cost control, so if we cannot read how much has
    // already been spent today, we do not spend more. Failing open would
    // break the one promise ADR 0002 makes — that worst-case spend is a
    // number Filip chooses — and would break it precisely when the
    // infrastructure is unhealthy and nobody is watching.
    //
    // This matters more than it looks: the API now opens its port before
    // Mongo connects (see server.js), so a database outage no longer keeps
    // requests away from this middleware by accident. The counter is
    // unreadable exactly when the chatbot would otherwise run unmetered.
    //
    // 503 rather than 429: the budget is not known to be exhausted, the
    // service is temporarily unable to verify it.
    console.error("checkTokenCeiling error, refusing to spend:", error);
    return res.status(503).json({
      error: "Chat is temporarily unavailable. Please try again shortly.",
    });
  }
}

// Adds `tokens` (a plain number — pass input_tokens + output_tokens from the
// Anthropic response's `usage` field) to today's persisted counter. Call
// this only after a successful Anthropic call.
async function recordTokenUsage(tokens) {
  if (!tokens || tokens <= 0) return;
  const date = todayUTC();
  await Usage.findOneAndUpdate(
    { date },
    { $inc: { tokensUsed: tokens } },
    { upsert: true, new: true }
  );
}

module.exports = { checkTokenCeiling, recordTokenUsage, getCeiling, todayUTC };
