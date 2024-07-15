import React from "react";
import {Message} from "../types/Chat";
import Paper from '@mui/material/Paper';
import {formatDistanceToNow} from "date-fns";
import {Box, Typography} from "@mui/material";

interface ChatBubbleProps {
    message: Message
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
                <Typography>
                    {props.message.content[0].text}
                </Typography>
            </Paper>
            <Typography variant="caption" sx={{mt: 0.5}}>
                {formatDistanceToNow(new Date(props.message.time!!), {addSuffix: true})}
            </Typography>
        </Box>
    )
}

export default ChatBubble;
