import React from "react";
import {Typography, Paper, Grid, Chip, Box, Card, CardContent, Avatar, List, Stack} from "@mui/material";
import { styled } from "@mui/system";
import PageHeader from "../components/PageHeader";
import { useTranslation } from "react-i18next";
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import { formatDuration, intervalToDuration, parseISO } from 'date-fns';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem, timelineItemClasses,
  TimelineSeparator
} from "@mui/lab";

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

  const experience =
    [
      {
        company: "Blank A/S",
        positions: [
          {
            role: "Teknolog",
            startDate: new Date(2025, 0),
            endDate: null
          },
        ]
      },
        {
          company: "Sopra Steria",
          positions: [
            {
              role: "Senior Consultant",
              startDate: new Date(2024, 6),
              endDate: new Date(2024, 11),
            },
            {
              role: "Consultant",
              startDate: new Date(2021, 7),
              endDate: new Date(2024, 5),
            },
          ]
        },
    ];

  const calculateDuration = (startDate: Date, endDate: Date | null) => {
    const end = endDate ? endDate : new Date();
    const duration = intervalToDuration({start: startDate, end: end});

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

  const dateToString = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en', {
      month: 'short',
      year: 'numeric'
    });

    return formatter.format(date).toLowerCase();
  }


  return (
      <>
        <PageHeader />
        <SectionHeader variant="h4">
          <WorkIcon />
          {t('cv.experience')}
        </SectionHeader>
        <Stack spacing={5}>
        {experience.map((companyExperience, companyExperienceIndex) => (
            <Paper key={companyExperienceIndex} elevation={3}>
              <CardContent>
                <Typography variant={"h4"}>
                  {companyExperience.company}
                </Typography>
                <Timeline position={"right"} sx={{
                  [`& .${timelineItemClasses.root}:before`]: {
                    flex: 0,
                    padding: 0,
                  },
                }}>
                  {companyExperience.positions.map((position, positionIndex) => (
                      <TimelineItem key={positionIndex}>
                        <TimelineSeparator>
                          <TimelineDot />
                          {positionIndex+1 !== companyExperience.positions.length && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent >
                          <Typography variant={"body1"}>
                            {position.role}
                          </Typography>
                          <Typography variant={"body1"}>
                            <>
                              {dateToString(position.startDate)}
                              {" - "}
                              {position.endDate ? dateToString(position.endDate) : t("cv.now")}
                            </>
                          </Typography>
                          <Typography variant={"body1"}>
                            {calculateDuration(position.startDate, position.endDate)}
                          </Typography>
                        </TimelineContent>
                      </TimelineItem>
                  ))}
                </Timeline>
              </CardContent>
            </Paper>
        ))}
        </Stack>

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
              <Stack spacing={1}>
                <Typography variant="h5">{t(`cv.education.${edu.key}.degree`)}</Typography>
                <Typography color="textSecondary" variant="caption">{t(`cv.education.${edu.key}.institution`)}</Typography>
                <Typography color="textSecondary" variant="caption" gutterBottom>
                  {t('cv.education.period')}: {edu.period}
                </Typography>
                <Typography color="textSecondary" variant="body2">{t(`cv.education.${edu.key}.description`)}</Typography>
              </Stack>
            </StyledPaper>
        ))}
      </>
  );
};

export default CV;
