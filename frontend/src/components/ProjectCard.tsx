import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import { ProjectStruct } from "../pages/Projects";
import React from "react";

interface ProjectCardProps {
  project: ProjectStruct;
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
