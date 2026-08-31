# 0004. Use the Anthropic SDK in place of hand-rolled HTTP calls

- Status: accepted
- Date: 2026-08-31
- Deciders: Filip
- Drivers: security, affordability, maintainability

## Context

`chatController.js` calls `https://api.anthropic.com/v1/messages` directly with `axios`, inside
a loop of up to five attempts that catches every error and retries regardless of kind. A 400
from a malformed request is retried five times, so bad input costs five calls instead of one —
an amplifier bolted onto the exact endpoint that decision 0002 is trying to bound. The pinned
model, `claude-3-7-sonnet-20250219`, has been superseded.

## Options considered

- **Keep the axios implementation** — no work, keeps the retry bug and the manual header
  management.
- **Adopt `@anthropic-ai/sdk`** — official client with typed errors, correct retry semantics
  and streaming.

## Decision

Use `@anthropic-ai/sdk`. Move to `claude-opus-5`. Stream the response to the chat UI.

## Consequences

**Good:** retries become correct — the SDK retries connection errors, 429 and 5xx, and does not
retry a 400. Typed error classes replace catch-everything. Streaming means the first token
reaches the visitor in well under a second, which does more for perceived responsiveness on the
chat page than any infrastructure change could.

**Bad:** a dependency where there was hand-rolled code, and the streaming change touches the
chat UI as well as the API, so it is not a purely backend edit.

**Left to the maintainer:** model choice is a live cost lever. `claude-haiku-4-5` is materially
cheaper per token and adequate for short biographical answers; `claude-opus-5` gives the best
answers. This design does not decide it, because decision 0002 makes worst-case spend bounded
either way — which is the point of putting the ceiling in the architecture rather than relying
on picking a cheap model.

**Note:** the system prompt describing Filip is roughly 800 tokens, just under the ~1024-token
minimum cacheable prefix, so prompt caching will not engage as written. If the prompt grows past
that threshold, add a cache breakpoint after it — the prompt is identical on every request and is
close to free to cache.

## Amendment 2 — 2026-09-01: prompt caching is now enabled

The note above said the system prompt was "roughly 800 tokens, just under the
~1024-token minimum cacheable prefix", and told the reader not to add a cache
breakpoint below that threshold. After adding the Autodesk section and the
personal detail, the prompt was **measured** at 1071 tokens — just over. The
breakpoint is now live.

Two things this exposed:

- **The estimate was wrong.** "Roughly 800" and later "roughly 950" were both
  guesses from character count. Whether caching engages is a threshold
  behaviour with no error when you fall short, so it is a measurement, not a
  judgement. `scripts/count-prompt-tokens.js` now answers it exactly; re-run it
  after editing the prompt. The margin is only ~47 tokens, so trimming the
  prompt would silently switch caching off again.

- **Enabling caching quietly under-reported spend.** Cached tokens are returned
  in their own `usage` fields and are *not* included in `input_tokens`. The
  daily ceiling from ADR 0002 counted only input plus output, so every cached
  request would have under-counted against the budget — a cost control
  weakened as a side effect of a performance change. It now counts
  `cache_creation_input_tokens` and `cache_read_input_tokens` too.

Cache effectiveness is logged per request, because a breakpoint that never
gets a hit is worse than no breakpoint: it costs ~1.25x on every write and
returns nothing.

