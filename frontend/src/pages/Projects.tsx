import React, {useEffect} from "react";
import PageHeader from "../components/PageHeader";
import ProjectCard from "../components/ProjectCard";
import { useTranslation } from "react-i18next";
import {Container, Stack, Typography, Button, useTheme} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Projects = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const projects = ["codeassistant", "mern", "illumie", "master", "drone"];

  // Add error boundary
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    return (
      <Container maxWidth="md">
        <Typography color="error">
          An error occurred while loading projects. Please try refreshing the page.
        </Typography>
      </Container>
    );
  }

  if (id) {
    return (
      <Container maxWidth="md">
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/projects')}
          sx={{
              mb: 4, color: theme.palette.text.primary,
              "&:hover": { color: theme.palette.primary.main },
          }}
        >
            <Typography
                variant="body2"
                component="div"
                sx={{
                    "&:hover": { color: theme.palette.primary.main },
                    color: theme.palette.text.primary,
                }}
            >
                {t("projects.back")}
            </Typography>
        </Button>
        <ProjectCard project={id} />
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <PageHeader />
      <Stack spacing={4} alignItems="center">
        {projects.map((item, index) => {
          try {
            return <ProjectCard project={item} key={index} />;
          } catch (err) {
            setError(err as Error);
            return null;
          }
        })}
      </Stack>
    </Container>
  );
};

export default Projects;