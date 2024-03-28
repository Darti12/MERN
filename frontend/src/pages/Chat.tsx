import React, {FormEvent, useEffect, useState} from "react";
import {useGetChatQuery, useLazyGetChatQuery, useUpdateChatMutation} from "../api/chatApi";
import {IconButton, InputBase, Paper, Stack, Typography} from "@mui/material";
import ChatBubble from "../components/ChatBubble";
import {Controller, FieldValues, useForm} from "react-hook-form";
import SendIcon from '@mui/icons-material/Send';
import {Message} from "../types/Chat";
import {useGetWorkoutsQuery} from "../api/workoutApi";
import {useParams} from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {isMobile} from "react-device-detect";
import PageHeader from "../components/PageHeader";

const Chat = () => {
    const methods = useForm();
    let { id } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([] as Message[]);

    const [updateChat, { isLoading, error, isSuccess, data: newChat }] = useUpdateChatMutation();
    const [getChat, {data: initialChat}] = useLazyGetChatQuery();

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
        <div style={{
            display: "grid",
            justifyContent: "center",
            gap: "2em",
        }}
        >
            <div style={{display: "flex", flexWrap: "wrap"}}>
                <Typography
                    variant={"h2"}
                    fontStyle={"bold"}
                    fontFamily={""}
                    sx={{marginLeft: "auto", marginRight: "auto"}}
                >
                    Claude Opus
                </Typography>
            </div>
            <Stack
                direction="column"
                justifyContent="flex-start"
                spacing={2}
                sx={{position: "relative", width: isMobile ? "90vw" : "50vw"}}
            >
                {messages.map((item) => (
                    <ChatBubble message={item}/>
                ))}
            </Stack>
            <form onSubmit={onSubmit} style={{display: "grid", justifyContent: "center"}}>
                <Controller
                    control={methods.control}
                    name="text"
                    defaultValue={""}
                    render={({field: {onChange, value}, fieldState: {error}}) => (
                        <Paper
                            component="form"
                            sx={{
                                p: '2px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                width: isMobile ? "80vw" : "50vw"
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
        </div>
    );
};

export default Chat;
