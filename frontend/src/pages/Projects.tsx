import React from "react";
import PageHeader from "../components/PageHeader";
import ProjectCard from "../components/ProjectCard";
import { Project } from "../types/Project";
import { useTranslation } from "react-i18next";

const Projects = () => {
  const { t } = useTranslation();

  //should do this with the express server...
  // but the server needs time to spin up from cold-boot, so this will make it quicker for the user.
  const projectAmount = 3;
  const projects = (): Project[] => {
    var projects: Project[] = [];
    for (let i = 0; i < projectAmount; i++) {
      var project: Project;
      project = {
        title: t(`projects.sections.${i}.title`),
        imageURL: t(`projects.sections.${i}.imageURL`),
        createdAt: new Date(t(`projects.sections.${i}.createdAt`)),
        gitHubUrl: t(`projects.sections.${i}.gitHubUrl`),
        longDescription: t(`projects.sections.${i}.longDescription`),
        shortDescription: t(`projects.sections.${i}.shortDescription`),
      } as Project;
      projects.push(project);
    }
    return projects.sort(
      (objA, objB) => objB?.createdAt!!.getTime() - objA?.createdAt!!.getTime(),
    );
  };

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
        {projects().map((item, index) => {
          return <ProjectCard project={item} key={index} />;
        })}
      </div>
    </>
  );
};

export default Projects;
