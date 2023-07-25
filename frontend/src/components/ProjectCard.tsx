import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import React from "react";
import { Project } from "../types/Project";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = (props: ProjectCardProps) => {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {props.project.title}
        </Typography>
        <Typography variant="body2">
          {props.project.shortDescription}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small">Learn More</Button>
      </CardActions>
    </Card>
  );
};

export default ProjectCard;
