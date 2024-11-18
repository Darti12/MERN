import {Card, CardHeader, CardMedia,} from "@mui/material";
import React from "react";
import {formatDistanceToNow, parseISO} from "date-fns";
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

    const formatDate = (dateString: string) => {
        try {
            // First try to parse the date string
            const date = parseISO(dateString);
            return formatDistanceToNow(date, {addSuffix: true});
        } catch (error) {
            // If parsing fails, try to create a date directly
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                    return "Date unavailable";
                }
                return formatDistanceToNow(date, {addSuffix: true});
            } catch {
                return "Date unavailable";
            }
        }
    };

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
                subheader={formatDate(t(`projects.sections.${props.project}.createdAt`))}
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