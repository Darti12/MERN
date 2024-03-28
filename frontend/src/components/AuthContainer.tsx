import { Card } from "@mui/material";
import React from "react";
import {isMobile} from "react-device-detect";

interface AuthContainerProps {
  children: React.ReactNode;
}

const AuthContainer = (props: AuthContainerProps) => {
  return (
    <Card
      style={{
          padding: "2em",
          width: isMobile ? "90vw" : "40vw",
          margin: "auto"
      }}
    >
      {props.children}
    </Card>
  );
};

export default AuthContainer;
