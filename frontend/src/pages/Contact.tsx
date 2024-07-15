import React from "react";
import PageHeader from "../components/PageHeader";
import {
  Button,
  Container,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import { useTranslation } from "react-i18next";

const Contact = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  const contactItems = [
    {
      icon: <LinkedInIcon fontSize="large" />,
      text: "LinkedIn",
      url: "https://www.linkedin.com/in/filip-hagen-16687a184",
    },
    {
      icon: <EmailIcon fontSize="large" />,
      text: "E-mail",
      url: "mailto:hagenfilip@gmail.com",
    },
  ];

  return (
    <Container maxWidth="md">
      <PageHeader />
      <Stack spacing={2} alignItems="stretch" sx={{ maxWidth: "400px", margin: "0 auto" }}>
        {contactItems.map((item, index) => (
          <Button
            key={index}
            startIcon={item.icon}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            fullWidth
            variant="outlined"
            sx={{
              justifyContent: "flex-start",
              padding: theme.spacing(2),
              color: theme.palette.text.primary,
              borderColor: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                backgroundColor: 'transparent',
              },
              "& .MuiButton-startIcon": {
                marginRight: theme.spacing(2),
              },
            }}
          >
            <Typography variant="button" sx={{ fontSize: "1.1rem" }}>
              {item.text}
            </Typography>
          </Button>
        ))}
      </Stack>
    </Container>
  );
};

export default Contact;
