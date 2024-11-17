import {
    CardActions,
    CardContent,
    IconButton,
    Typography,
} from "@mui/material";
import React from "react";
import GitHubIcon from "@mui/icons-material/GitHub";
import { useTranslation } from "react-i18next";

interface ProjectCardDetailsProps {
  project: string;
}

const ProjectCardDetails = (props: ProjectCardDetailsProps) => {
    const {t} = useTranslation();
    const openInNewTab = (url: string) => {
        window.open(url, "_blank", "noreferrer");
    };

    const getTranslatedTextList = (key: string) => {
        const textList = [];

        // @ts-ignore
        for (const text of t(`projects.sections.${key}.description`, {returnObjects: true})) {
            textList.push(text);
        }
        return textList;
    }

    return(
        <>
            <CardContent>
                    {getTranslatedTextList(props.project).map((text: string, index: number) => (
                        <Typography paragraph key={index}>
                            {text}
                        </Typography>
                    ))}
            </CardContent>

            <CardActions disableSpacing>
                {t(`projects.sections.${props.project}.gitHubUrl`) && (
                    <IconButton
                        onClick={() =>
                            openInNewTab(t(`projects.sections.${props.project}.gitHubUrl`)!!)
                        }
                    >
                        <GitHubIcon fontSize={"large"}/>
                    </IconButton>
                )}
            </CardActions>
        </>
    )
}

export default ProjectCardDetails;
