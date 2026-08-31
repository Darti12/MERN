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
