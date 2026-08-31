#!/usr/bin/env node
// Measures the chatbot system prompt's token count against the ~1024-token
// minimum cacheable prefix (see ADR 0004).
//
// Prompt caching silently does nothing below that threshold, so "should we add
// a cache breakpoint?" is not a judgement call — it is a measurement. Run this
// after editing the prompt:
//
//   node -r dotenv/config scripts/count-prompt-tokens.js dotenv_config_path=backend/.env
//
// Uses the free count_tokens endpoint; it does not generate anything.

const path = require("path");
const Anthropic = require(path.join(__dirname, "..", "backend", "node_modules", "@anthropic-ai", "sdk"));
const { buildSystemPrompt } = require(path.join(__dirname, "..", "backend", "controllers", "chatController"));

const MIN_CACHEABLE = 1024;

(async () => {
  const client = new Anthropic();
  const model = "claude-sonnet-5";
  const probe = [{ role: "user", content: "hi" }];

  const withSystem = await client.messages.countTokens({
    model,
    system: buildSystemPrompt(),
    messages: probe,
  });
  const withoutSystem = await client.messages.countTokens({ model, messages: probe });

  const systemTokens = withSystem.input_tokens - withoutSystem.input_tokens;
  const pct = Math.round((systemTokens / MIN_CACHEABLE) * 100);

  console.log(`system prompt:        ${systemTokens} tokens`);
  console.log(`minimum cacheable:    ${MIN_CACHEABLE} tokens`);
  console.log(`                      ${pct}% of the threshold`);
  console.log(
    systemTokens >= MIN_CACHEABLE
      ? `\nOVER the threshold — a cache breakpoint on the system block is now worth adding.`
      : `\nUNDER by ${MIN_CACHEABLE - systemTokens} tokens — caching would not engage. Do not add a breakpoint yet.`
  );
})().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
