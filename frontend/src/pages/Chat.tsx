import React, {FormEvent, useEffect, useState} from "react";
import {useLazyGetChatQuery, useUpdateChatMutation} from "../api/chatApi";
import {IconButton, InputBase, Paper, Stack, Typography, Container} from "@mui/material";
import ChatBubble from "../components/ChatBubble";
import {Controller, FieldValues, useForm} from "react-hook-form";
import SendIcon from '@mui/icons-material/Send';
import {Message} from "../types/Chat";
import {useParams} from "react-router-dom";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import {usePingServerMutation} from "../api/authApi";

const Chat = () => {
    const methods = useForm();
    let { id } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([] as Message[]);

    const [updateChat, { isLoading, error, isSuccess, data: newChat }] = useUpdateChatMutation();
    const [getChat, {data: initialChat}] = useLazyGetChatQuery();

    const [serviceStatus, setServiceStatus] = useState<'Offline' | 'Turning on...' | 'Online'>('Offline');
    const [pingServer] = usePingServerMutation();

    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                setServiceStatus('Turning on...');
                await pingServer().unwrap();
                setServiceStatus('Online');
            } catch (error) {
                setServiceStatus('Offline');
            }
        };

        checkServerStatus();
        const interval = setInterval(checkServerStatus, 15000); // Check every 15 seconds

        return () => clearInterval(interval);
    }, [pingServer]);

    const onSubmit = (e?: FormEvent) => {
        e?.preventDefault();
        // do your early validation here

        methods.handleSubmit(() => {
            const data: FieldValues = methods.getValues();

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
                Service: {serviceStatus}
            </Typography>
            <Stack spacing={2} alignItems="stretch">
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
                                multiline={true}
                                rows={4}
                                disabled={isLoading}
                            />
                            <IconButton type="button" sx={{p: '10px'}} onClick={onSubmit}
                                        disabled={isLoading || !methods.getValues("text")}>
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
