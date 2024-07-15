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
    messages: Message[] | null
}
