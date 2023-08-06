import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Collapse,
  IconButton,
  IconButtonProps,
  styled,
  Typography,
} from "@mui/material";
import React from "react";
import { Project } from "../types/Project";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { formatDistanceToNow } from "date-fns";
import {
  BrowserView,
  MobileView,
  isBrowser,
  isMobile,
} from "react-device-detect";

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = (props: ProjectCardProps) => {
  const [expanded, setExpanded] = React.useState(false);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card sx={{ minWidth: isMobile ? "90vw" : "60vw" }}>
      <CardHeader
        title={props.project.title}
        subheader={formatDistanceToNow(new Date(props.project.createdAt!!), {
          addSuffix: true,
        })}
      />
      <CardMedia
        component="img"
        height="200"
        image={props.project.imageURL}
        alt={props.project.title + " image"}
      />
      <CardContent>
        <Typography variant="body2">
          {props.project.shortDescription}
        </Typography>
      </CardContent>
      {props.project.longDescription && (
        <CardActions disableSpacing>
          <ExpandMore
            expand={expanded}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon />
          </ExpandMore>
        </CardActions>
      )}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph>More info:</Typography>
          <Typography paragraph>{props.project.longDescription}</Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default ProjectCard;
