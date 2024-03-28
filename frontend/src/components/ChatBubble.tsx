import React from "react";
import {Message} from "../types/Chat";
import Paper from '@mui/material/Paper';
import {formatDistanceToNow} from "date-fns";
import {isMobile} from "react-device-detect";



interface ChatBubbleProps {
    message: Message
}

const ChatBubble = (props: ChatBubbleProps) => {


    return (
        <div style={{
            display: "grid",
            justifyItems: props.message.role === "user" ? "right" : "left",
        }}
        >
            <h5 style={{marginBottom: "3px"}}>{props.message.role}</h5>
            <Paper elevation={3} square={false}
                   sx={{display: 'flex', padding: "20px", margin: "0px", alignItems: 'center', width: isMobile ? "80vw" : "35vw"}}>
                {props.message.content[0].text}
            </Paper>
            <h5 style={{marginTop: "3px"}}>{formatDistanceToNow(new Date(props.message.time!!), {addSuffix: true})}</h5>
        </div>
    )
}


export default ChatBubble;