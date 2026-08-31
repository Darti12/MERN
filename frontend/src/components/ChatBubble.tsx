import React from "react";
import {Message, messageText} from "../types/Chat";
import Paper from '@mui/material/Paper';
import {formatDistanceToNow} from "date-fns";
import {Box, Typography} from "@mui/material";

interface ChatBubbleProps {
    message: Message,
    // True while this bubble's content is still being appended to token by
    // token (ADR 0004). Only ever true for the newest assistant message.
    isStreaming?: boolean
}

const ChatBubble = (props: ChatBubbleProps) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: props.message.role === "user" ? "flex-end" : "flex-start",
                width: "100%",
            }}
        >
            <Typography variant="caption" sx={{mb: 0.5}}>
                {props.message.role}
            </Typography>
            <Paper
                elevation={3}
                sx={{
                    padding: 2,
                    maxWidth: "80%",
                    wordWrap: "break-word",
                }}
            >
                <Typography component="span">
                    {messageText(props.message)}
                    {props.isStreaming && (
                        <Box
                            component="span"
                            aria-hidden="true"
                            sx={{
                                display: "inline-block",
                                width: "0.5em",
                                marginLeft: "2px",
                                borderRight: "2px solid currentColor",
                                animation: "chat-bubble-cursor-blink 1s steps(1) infinite",
                                "@keyframes chat-bubble-cursor-blink": {
                                    "50%": { opacity: 0 },
                                },
                            }}
                        />
                    )}
                </Typography>
            </Paper>
            <Typography variant="caption" sx={{mt: 0.5}}>
                {props.isStreaming
                    ? "typing…"
                    : formatDistanceToNow(new Date(props.message.time!!), {addSuffix: true})}
            </Typography>
        </Box>
    )
}

export default ChatBubble;
