export interface Message {
    time: string,
    role: string,
    content: [
        {
            type: string,
            text: string
        }
    ]
}

export interface Chat {
    _id?: string,
    // High-entropy per-conversation token (backend/models/ChatModel.js).
    // This, not _id, is the lookup key used in the /chat/:id URL and sent
    // back to the API to continue a conversation -- the Mongo ObjectId is
    // only weakly unguessable and is never used for retrieval.
    token?: string,
    messages: Message[] | null
}

/**
 * The visible text of a message.
 *
 * Never read `content[0].text` directly: a model reply can contain more than
 * one block, and with adaptive thinking the first one may not be the text at
 * all. The backend strips non-text blocks before persisting, but transcripts
 * stored before that fix still contain them, so this stays defensive.
 */
export const messageText = (message: Message): string =>
  (message.content ?? [])
    .filter((block: any) => block?.type === "text" && typeof block.text === "string")
    .map((block: any) => block.text)
    .join("");
