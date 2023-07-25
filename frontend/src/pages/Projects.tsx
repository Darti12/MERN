import React from "react";
import { Stack } from "@mui/material";
import ProjectCard from "../components/ProjectCard";
import { useGetProjectsQuery } from "../api/projectApi";

interface projectsProps {}

const Projects = (props: projectsProps) => {
  const { data: projects } = useGetProjectsQuery();

  return (
    <div>
      <Stack spacing={2}>
        {projects?.map((item, index) => {
          return <ProjectCard project={item} />;
        })}
      </Stack>
    </div>
  );
};

export default Projects;
