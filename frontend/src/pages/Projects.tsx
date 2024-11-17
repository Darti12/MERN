import React from "react";
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
  const projects = ["mern", "illumie", "drone", "master"];

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
        {projects.map((item, index) => (
          <ProjectCard project={item} key={index} />
        ))}
      </Stack>
    </Container>
  );
};

export default Projects;