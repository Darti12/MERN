import React from "react";
import PageHeader from "../components/PageHeader";
import ProjectCard from "../components/ProjectCard";
import { useTranslation } from "react-i18next";
import { Container, Stack } from "@mui/material";

const Projects = () => {
  const { t } = useTranslation();

  // Should do this with the express server...
  // but the server needs time to spin up from cold-boot, so this will make it quicker for the user.
  const projectAmount = [2, 0, 3, 1];

  return (
    <Container maxWidth="md">
      <PageHeader />
      <Stack spacing={4} alignItems="center">
        {projectAmount.map((item, index) => (
          <ProjectCard project={item} key={index} />
        ))}
      </Stack>
    </Container>
  );
};

export default Projects;
