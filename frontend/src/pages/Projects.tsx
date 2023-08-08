import React from "react";
import PageHeader from "../components/PageHeader";
import ProjectCard from "../components/ProjectCard";
import { Project } from "../types/Project";
import { useTranslation } from "react-i18next";

const Projects = () => {
  const { t } = useTranslation();

  //should do this with the express server...
  // but the server needs time to spin up from cold-boot, so this will make it quicker for the user.
  const projectAmount = [2, 0, 3, 1];

  return (
    <>
      <PageHeader />
      <div
        style={{
          display: "grid",
          justifyContent: "center",
          gap: "2em",
        }}
      >
        {projectAmount.map((item, index) => {
          return <ProjectCard project={item} key={index} />;
        })}
      </div>
    </>
  );
};

export default Projects;
