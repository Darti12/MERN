import React from "react";
import { Typography, Paper, Grid, Chip, Box, Card, CardContent, Avatar } from "@mui/material";
import { styled } from "@mui/system";
import PageHeader from "../components/PageHeader";
import { useTranslation } from "react-i18next";
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import { formatDuration, intervalToDuration, parseISO } from 'date-fns';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2, 0),
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(4),
}));

const CertificationCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}));

const CV = () => {
  const { t } = useTranslation();

  const experience = {
    company: "Sopra Steria",
    projects: [
      {
        role: ".NET Developer",
        startDate: "2023-10-01",
        endDate: "2024-07-07", // null indicates current project
        technologies: ["Unity", ".NET Core", "C#", "Azure Web Apps", "MongoDB", "Docker", "Mixed Reality", "DevOps", "Microsoft HoloLens"],
      },
      {
        role: "Full Stack Developer",
        startDate: "2022-08-01",
        endDate: "2024-02-29",
        technologies: ["Scrum", "Apache Kafka", "Kotlin", "TypeScript", "Git", "React.js", "React Hooks", "Spring Boot", "GitLab CI/CD", "Redux", "Microservices", "Kubernetes", "Cypress"],
      },
      {
        role: "Mixed Reality Developer",
        startDate: "2022-06-01",
        endDate: "2022-08-31",
        technologies: ["Unity", "C#", ".NET Framework", "Microsoft HoloLens", "3D Modeling", "SignalR", "Oculus Quest", "Virtual Reality", "Augmented Reality"],
      },
      {
        role: "Mixed Reality Developer",
        startDate: "2021-09-01",
        endDate: "2022-04-30",
        technologies: ["Azure Spatial Anchors", "ARKit", "ARDK", "Unity3D", "iOS Development", "Android", "C#", "Blender", "GitHub", "Azure Cosmos DB", "Azure Table Storage", "ARCore", "Coarse Relocalization", "Xcode", ".NET Framework"],
      },
    ]
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = parseISO(startDate);
    const end = endDate ? parseISO(endDate) : new Date();
    const duration = intervalToDuration({ start, end });

    const formatOptions: Intl.RelativeTimeFormatUnit[] = ['years', 'months'];
    const formatted = formatDuration(duration, { format: formatOptions });

    if (duration.years === 0 && duration.months === 0) {
      return t('cv.lessThanAMonth');
    }

    return formatted
        .replace('years', t('cv.years'))
        .replace('year', t('cv.year'))
        .replace('months', t('cv.months'))
        .replace('month', t('cv.month'));
  };

  const certifications = [
    { name: "Kotlin for Java Developers", date: "07.2022" },
    { name: "Unity Certified Expert: Programmer", date: "04.2022" },
    { name: "Unity Certified Professional: Programmer", date: "10.2021" },
    { name: "AZ-400: Microsoft Azure DevOps Solutions", date: "09.2021" },
    { name: "Microsoft Certified: DevOps Engineer Expert", date: "09.2021" },
    { name: "Microsoft Certified: Azure Developer Associate", date: "08.2021" },
  ];

  const education = [
    {
      key: 'master',
      period: "08.2019 - 06.2021",
    },
    {
      key: 'bachelor',
      period: "08.2016 - 06.2019",
    },
  ];

  return (
      <>
        <PageHeader />
        <SectionHeader variant="h4">
          <WorkIcon />
          {t('cv.experience')}
        </SectionHeader>
        <Typography variant="h5">{experience.company}</Typography>
        {experience.projects.map((project, projectIndex) => (
            <StyledPaper key={projectIndex} elevation={3}>
              <Typography variant="h6">{project.role}</Typography>
              <Typography variant="subtitle1" gutterBottom>
                {t('cv.period')}: {project.startDate} - {project.endDate || t('cv.present')}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                {t('cv.duration')}: {calculateDuration(project.startDate, project.endDate)}
              </Typography>
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('cv.technologies')}:
                </Typography>
                <Grid container spacing={1}>
                  {project.technologies.map((tech, techIndex) => (
                      <Grid item key={techIndex}>
                        <Chip label={tech} variant="outlined" />
                      </Grid>
                  ))}
                </Grid>
              </Box>
            </StyledPaper>
        ))}

        <SectionHeader variant="h4">
          <CardMembershipIcon />
          {t('cv.certifications')}
        </SectionHeader>
        <Grid container spacing={2}>
          {certifications.map((cert, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <CertificationCard elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {cert.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('cv.obtained')}: {cert.date}
                    </Typography>
                  </CardContent>
                  <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        alignSelf: 'flex-end',
                        margin: 2,
                      }}
                  >
                    {cert.name.charAt(0)}
                  </Avatar>
                </CertificationCard>
              </Grid>
          ))}
        </Grid>

        <SectionHeader variant="h4">
          <SchoolIcon />
          {t('cv.education.header')}
        </SectionHeader>
        {education.map((edu, index) => (
            <StyledPaper key={index} elevation={3}>
              <Typography variant="h6">{t(`cv.education.${edu.key}.degree`)}</Typography>
              <Typography variant="subtitle1">{t(`cv.education.${edu.key}.institution`)}</Typography>
              <Typography variant="subtitle2" gutterBottom>
                {t('cv.education.period')}: {edu.period}
              </Typography>
              <Typography variant="body2">{t(`cv.education.${edu.key}.description`)}</Typography>
            </StyledPaper>
        ))}
      </>
  );
};

export default CV;
