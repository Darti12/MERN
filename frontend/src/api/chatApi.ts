import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {Chat} from "../types/Chat";
import { CHAT_API_BASE_URL } from "../config";

// Sending a message streams the reply back token-by-token (ADR 0004) as
// server-sent events, rather than one JSON blob. fetchBaseQuery always
// awaits and parses a full response body, so it can't express that — this
// helper uses the raw Fetch API instead and is called directly from
// Chat.tsx rather than through an RTK Query mutation hook. getChat/getChats/
// deleteChat below are unaffected and stay on fetchBaseQuery as before.
export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; chat: Chat }
  | { type: "error"; error: string };

export interface ChatStreamHandlers {
  onDelta: (text: string) => void;
  onDone: (chat: Chat) => void;
  onError: (message: string) => void;
}

/**
 * POSTs a message list to /api/chat and relays the streamed reply to the
 * given handlers as it arrives. Resolves once the stream ends (successfully
 * or not) — errors are reported via `onError`, never thrown.
 */
export async function streamChatUpdate(
  payload: Chat,
  handlers: ChatStreamHandlers
): Promise<void> {
  try {
    const response = await fetch(`${CHAT_API_BASE_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      // The API returns errors as {"error": "..."} — including the abuse
      // guard's 429 and 503 (ADR 0002), which are the ones a real visitor is
      // most likely to see. Passing the raw body through showed them the JSON
      // itself. Surface the message, and only fall back to the raw text if
      // the body isn't the shape we expect.
      const raw = await response.text().catch(() => "");
      let message = raw;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.error === "string") message = parsed.error;
      } catch {
        // Not JSON — keep the raw text.
      }
      handlers.onError(message || `Request failed with status ${response.status}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line; a chunk from the network
      // may contain zero, one, or several complete frames, and may end
      // mid-frame, so drain every complete frame and keep the remainder.
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const dataLine = rawEvent
          .split("\n")
          .find((line) => line.startsWith("data: "));

        if (dataLine) {
          const event = JSON.parse(dataLine.slice("data: ".length)) as ChatStreamEvent;
          if (event.type === "delta") {
            handlers.onDelta(event.text);
          } else if (event.type === "done") {
            handlers.onDone(event.chat);
          } else if (event.type === "error") {
            handlers.onError(event.error);
          }
        }

        boundary = buffer.indexOf("\n\n");
      }
    }
  } catch (error) {
    handlers.onError(error instanceof Error ? error.message : "Chat request failed");
  }
}

export const chatApi = createApi({
  reducerPath: "chatApi",
  // Setting the baseUrl for every endpoint below.
  // No auth header: /api/chat is deliberately unauthenticated (see ADR 0002 —
  // anonymity is a hard constraint for the portfolio chatbot), and there is
  // no user state left in the store to source a token from since ADR 0005.
  baseQuery: fetchBaseQuery({
    baseUrl: CHAT_API_BASE_URL,
  }),
  tagTypes: ["Chat"],
  endpoints: (builder) => ({
    // `id` here is the conversation's high-entropy token (see
    // backend/models/ChatModel.js), not its Mongo ObjectId -- that's the
    // hardened lookup key GET /api/chat/:id expects. There is no
    // list-all-chats endpoint: chat is anonymous by constraint (ADR 0002),
    // so there is no ownership model to list against.
    getChat: builder.query<Chat, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["Chat"],
    }),
    // Sending a message (the only endpoint that calls Anthropic) went from a
    // POST mutation here to the streamChatUpdate() helper above — see its
    // comment for why.
    deleteChat: builder.mutation<Chat, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chat"],
    }),
  }),
});

export const {
  useGetChatQuery,
  useLazyGetChatQuery,
  useDeleteChatMutation
} = chatApi;
