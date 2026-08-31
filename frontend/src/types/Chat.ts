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
