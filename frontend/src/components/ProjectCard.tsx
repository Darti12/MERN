import {Card, CardHeader, CardMedia,} from "@mui/material";
import React from "react";
import {formatDistanceToNow} from "date-fns";
import {useTranslation} from "react-i18next";
import ProjectCardDetails from "./ProjectCardDetails";
import {useLocation, useNavigate} from "react-router-dom";

interface ProjectCardProps {
  project: string;
}

const ProjectCard = (props: ProjectCardProps) => {
    const {t} = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const isExpanded = () => {
        return location.pathname.includes(`/projects/`);
    }

    return(
        <Card
            sx={{
                width: "100%",
                cursor: !isExpanded() ? "pointer" : "default"
            }}
            onClick={!isExpanded() ? () => navigate(`/projects/${props.project}`) : () => null}
        >
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
                image={t(`projects.sections.${props.project}.imageURL`)}
                alt={t(`projects.sections.${props.project}.title`) + " image"}
            />
            {isExpanded() && (
                <ProjectCardDetails project={props.project}/>
            )}
        </Card>
    )
}

export default ProjectCard;
