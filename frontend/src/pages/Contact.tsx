import React from "react";
import PageHeader from "../components/PageHeader";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";

const Contact = () => {
  const theme = useTheme();

  return (
    <>
      <PageHeader />
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <LinkedInIcon fontSize={"large"} />
            </ListItemIcon>
            <ListItemText>
              <a
                href="https://www.linkedin.com/in/filip-hagen-16687a184"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: theme.palette.text.primary,
                  textDecoration: "none",
                }}
              >
                LinkedIn
              </a>
            </ListItemText>
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <EmailIcon fontSize={"large"} />
            </ListItemIcon>
            <ListItemText>
              <a
                href="mailto:hagenfilip@gmail.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: theme.palette.text.primary,
                  textDecoration: "none",
                }}
              >
                E-mail
              </a>
            </ListItemText>
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );
};

export default Contact;
