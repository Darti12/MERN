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
import GitHubIcon from "@mui/icons-material/GitHub";
import {
  BrowserView,
  MobileView,
  isBrowser,
  isMobile,
} from "react-device-detect";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
  project: number;
}

const ProjectCard = (props: ProjectCardProps) => {
  const [expanded, setExpanded] = React.useState(false);
  const { t } = useTranslation();
  const openInNewTab = (url: string) => {
    window.open(url, "_blank", "noreferrer");
  };
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card sx={{ width: isMobile ? "90vw" : "50vw" }}>
      <CardHeader
        title={t(`projects.sections.${props.project}.title`)}
        subheader={formatDistanceToNow(
          new Date(t(`projects.sections.${props.project}.createdAt`)!!),
          {
            addSuffix: true,
          },
        )}
      />
      <CardMedia
        component="img"
        height="200"
        image={t(`projects.sections.${props.project}.imageURL`)}
        alt={t(`projects.sections.${props.project}.title`) + " image"}
      />
      <CardContent>
        <Typography paragraph>
          {t(`projects.sections.${props.project}.shortDescription`)}
        </Typography>
      </CardContent>

      <CardActions disableSpacing>
        {t(`projects.sections.${props.project}.gitHubUrl`) && (
          <IconButton
            onClick={() =>
              openInNewTab(t(`projects.sections.${props.project}.gitHubUrl`)!!)
            }
          >
            <GitHubIcon fontSize={"large"} />
          </IconButton>
        )}
        {t(`projects.sections.${props.project}.longDescription`) && (
          <ExpandMore
            expand={expanded}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon fontSize={"large"} />
          </ExpandMore>
        )}
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph>More info:</Typography>
          <Typography paragraph>
            {t(`projects.sections.${props.project}.longDescription`)}
          </Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default ProjectCard;
