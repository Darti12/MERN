import {Card} from "@mui/material";
import React from "react";

interface AuthContainerProps {
    children: React.ReactNode;
}

const AuthContainer = (props: AuthContainerProps) => {
    return (
        <Card style={{
            padding: "2em",
            maxWidth: "25%",
            margin: "2em"}}>
            {props.children}
        </Card>
    )
}

export default AuthContainer;