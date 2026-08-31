import React, {FormEvent, useEffect, useState} from "react";
import {useLazyGetChatQuery, streamChatUpdate} from "../api/chatApi";
import {Alert, IconButton, InputBase, Paper, Stack, Typography, Container} from "@mui/material";
import ChatBubble from "../components/ChatBubble";
import {Controller, FieldValues, useForm} from "react-hook-form";
import SendIcon from '@mui/icons-material/Send';
import {Message, messageText} from "../types/Chat";
import {useParams} from "react-router-dom";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { HEALTH_URL, isApiConfigured } from "../config";

const Chat = () => {
    const methods = useForm();
    // The URL param is the conversation's high-entropy token (see
    // backend/models/ChatModel.js), not its Mongo ObjectId -- kept as `id`
    // here only because that's the route param name in App.tsx.
    let { id: token } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([{
        role: "assistant",
        content: [
            {type: "text", text: "Hi! Ask me anything about Filip!"}
        ],
        time: new Date().toString()
    }] as Message[]);

    // The reply streams in token by token (ADR 0004) rather than arriving as
    // one RTK Query mutation result, so sending state is tracked locally.
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [getChat, {data: initialChat}] = useLazyGetChatQuery();

    const [serviceStatus, setServiceStatus] = useState<'Offline' | 'Turning on...' | 'Online'>('Offline');

    useEffect(() => {
        // With no API configured there is nothing to poll — stay Offline and
        // let the banner below explain it, rather than failing every 30s.
        if (!isApiConfigured) {
            setServiceStatus('Offline');
            return;
        }

        const checkServerStatus = async () => {
            try {
                setServiceStatus('Turning on...');
                const response = await fetch(HEALTH_URL);
                if (!response.ok) {
                    throw new Error('Health check failed');
                }
                setServiceStatus('Online');
            } catch (error) {
                setServiceStatus('Offline');
            }
        };

        checkServerStatus();
        const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // The API is scale-to-zero (ADR 0001), so Offline is an ordinary state
    // rather than an error: the portfolio is unaffected and only this page
    // degrades. Sending is blocked while offline so a message cannot be
    // silently swallowed.
    const isOffline = serviceStatus === 'Offline';
    const canSend = !isSending && !isOffline;

    const onSubmit = (e?: FormEvent) => {
        e?.preventDefault();
        // do your early validation here

        methods.handleSubmit(() => {
            const data: FieldValues = methods.getValues();

            if (data.text == null || data.text === "" ) {
                return;
            }

            if (isOffline || isSending) {
                return;
            }

            const newMessages: Message[] = [
                ...messages,
                {
                    content: [
                        {
                            type: "text",
                            text: data.text
                        }
                    ],
                    time: new Date().toString(),
                    role: "user",
                }
            ];

            // A placeholder assistant bubble that fills in as tokens stream
            // back (ADR 0004) — appended once, then mutated in place by
            // onDelta below rather than growing the array per token.
            setMessages([
                ...newMessages,
                { role: "assistant", content: [{ type: "text", text: "" }], time: new Date().toString() },
            ]);
            setSendError(null);
            setIsSending(true);
            methods.reset();

            streamChatUpdate(
                { token, messages: newMessages },
                {
                    onDelta: (text) => {
                        setMessages((prev) => {
                            const next = [...prev];
                            const last = next[next.length - 1];
                            next[next.length - 1] = {
                                ...last,
                                content: [{ type: "text", text: messageText(last) + text }],
                            };
                            return next;
                        });
                    },
                    onDone: (chat) => {
                        setIsSending(false);
                        if (!token && chat.token) {
                            navigate(`/chat/${chat.token}`);
                        }
                        if (chat.messages) {
                            setMessages(chat.messages);
                        }
                    },
                    onError: (message) => {
                        setIsSending(false);
                        setSendError(message);
                    },
                }
            );
        })(e);
    };

    useEffect(() => {
        if (token){
            getChat(token)
        }
    }, [token]);

    useEffect(() => {
        if (initialChat){
            setMessages(initialChat.messages!!)
        }
    }, [initialChat]);


    return (
        <Container maxWidth="md">
            <PageHeader overrideHeader={"Chat with Claude"}/>
            <Typography>
                {serviceStatus}
            </Typography>
            {isOffline && (
                <Alert severity="info" sx={{ mt: 1 }}>
                    {isApiConfigured
                        ? "The chat service is asleep and waking up. This can take up to a minute on the first message of the day — everything else on the site works normally in the meantime."
                        : "The chat service is not configured for this build. The rest of the site is unaffected."}
                </Alert>
            )}
            {sendError && (
                <Alert severity="error" sx={{ mt: 1 }} onClose={() => setSendError(null)}>
                    {sendError}
                </Alert>
            )}
            <Stack spacing={2} alignItems="stretch" marginTop={2}>
                {messages.map((item, index) => (
                    <ChatBubble
                        key={index}
                        message={item}
                        isStreaming={isSending && index === messages.length - 1 && item.role === "assistant"}
                    />
                ))}
            </Stack>
            <form onSubmit={onSubmit} style={{marginTop: '20px'}}>
                <Controller
                    control={methods.control}
                    name="text"
                    defaultValue={""}
                    render={({field: {onChange, value}, fieldState: {error}}) => (
                        <Paper
                            sx={{
                                p: '2px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%'
                            }}
                        >
                            <InputBase
                                sx={{ml: 1, flex: 1}}
                                onChange={onChange}
                                value={value}
                                error={!!error}
                                placeholder="Write something..."
                                rows={4}
                                disabled={!canSend}
                            />
                            <IconButton type="button" sx={{p: '10px'}} onClick={onSubmit}
                                        disabled={!canSend || !methods.getValues("text")}>
                                <SendIcon/>
                            </IconButton>
                        </Paper>
                    )}
                />
            </form>
        </Container>
    );
};

export default Chat;
