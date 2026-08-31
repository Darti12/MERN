import React, {FormEvent, useEffect, useState} from "react";
import {useLazyGetChatQuery, useUpdateChatMutation} from "../api/chatApi";
import {Alert, IconButton, InputBase, Paper, Stack, Typography, Container} from "@mui/material";
import ChatBubble from "../components/ChatBubble";
import {Controller, FieldValues, useForm} from "react-hook-form";
import SendIcon from '@mui/icons-material/Send';
import {Message} from "../types/Chat";
import {useParams} from "react-router-dom";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { HEALTH_URL, isApiConfigured } from "../config";

const Chat = () => {
    const methods = useForm();
    let { id } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([{
        role: "assistant",
        content: [
            {type: "text", text: "Hi! Ask me anything about Filip!"}
        ],
        time: new Date().toString()
    }] as Message[]);

    const [updateChat, { isLoading, error, isSuccess, data: newChat }] = useUpdateChatMutation();
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
    const canSend = !isLoading && !isOffline;

    const onSubmit = (e?: FormEvent) => {
        e?.preventDefault();
        // do your early validation here

        methods.handleSubmit(() => {
            const data: FieldValues = methods.getValues();

            if (data.text == null || data.text === "" ) {
                return;
            }

            if (isOffline) {
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

            setMessages(newMessages);
            updateChat({
                _id: id,
                messages: newMessages
            });
            methods.reset();
        })(e);
    };

    useEffect(() => {
        if (!id && newChat){
            navigate(`/chat/${newChat._id}`);
        }
        if (newChat){
            setMessages(newChat.messages!!)
        }
    }, [newChat]);

    useEffect(() => {
        if (id){
            getChat(id)
        }
    }, [id]);

    useEffect(() => {
        if (initialChat){
            setMessages(initialChat.messages!!)
        }
    }, [initialChat]);


    return (
        <Container maxWidth="md">
            <PageHeader overrideHeader={"Claude Sonnet"}/>
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
            <Stack spacing={2} alignItems="stretch" marginTop={2}>
                {messages.map((item, index) => (
                    <ChatBubble key={index} message={item}/>
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
