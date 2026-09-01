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

interface Position {
  role: string;
  startDate: Date;
  endDate: Date | null;
}

interface Experience {
  company: string;
  positions: Position[];
}

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
              startDate: new Date(2024, 6, 1),
              endDate: new Date(2024, 11, 31),
            },
            {
              role: "Consultant",
              startDate: new Date(2021, 7, 1),
              endDate: new Date(2024, 5, 30),
            },
          ]
        },
    ] as Experience[];

  const getCompanyDuration = (experience: Experience): string => {
    const dates = experience.positions.map(pos => ({
      start: pos.startDate,
      end: pos.endDate || new Date()
    }));

    const earliestStart = dates.reduce((min, curr) =>
        curr.start < min ? curr.start : min, dates[0].start);

    const latestEnd = dates.reduce((max, curr) =>
        curr.end > max ? curr.end : max, dates[0].end);

    return calculateDuration(earliestStart, latestEnd);
  };

  const calculateDuration = (startDate: Date, endDate: Date | null) => {
    const end = endDate ?? new Date();
    const duration = intervalToDuration({start: startDate, end: end});

    // Include partial months by adding a month if there are any days
    if (duration.days && duration.days > 0) {
      duration.months = (duration.months ?? 0) + 1;
    }

    const formatted = formatDuration(duration, { format: ['years', 'months'] });

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
    {
      name: "Google Cloud Certified - Associate Cloud Engineer",
      date: new Date(2025, 7)
    },
    {
      name: "Kotlin for Java Developers",
      date: new Date(2022, 6)
    },
    {
      name: "Unity Certified Expert: Programmer",
      date: new Date(2022, 3)
    },
    {
      name: "Unity Certified Professional: Programmer",
      date: new Date(2021, 9)
    },
    {
      name: "AZ-400: Microsoft Azure DevOps Solutions",
      date: new Date(2021, 8)
    },
    {
      name: "Microsoft Certified: DevOps Engineer Expert",
      date: new Date(2021, 8)
    },
    {
      name: "Microsoft Certified: Azure Developer Associate",
      date: new Date(2021, 7)
    },
  ];

  const education = [
    {
      key: 'master',
      startDate: new Date(2019, 7),
      endDate: new Date(2021, 5),
    },
    {
      key: 'bachelor',
      startDate: new Date(2016, 7),
      endDate: new Date(2019, 5),
    },
  ];

  const dateToString = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en', {
      month: 'short',
      year: 'numeric'
    });

    return formatter.format(date);
  }


  return (
      <>
        <PageHeader />
        <SectionHeader variant="h4">
          <WorkIcon />
          { } {t('cv.experience')}
        </SectionHeader>
        <Stack spacing={5}>
        {experience.map((companyExperience, companyExperienceIndex) => (
            <Paper key={companyExperienceIndex} elevation={3}>
              <CardContent>
                <Typography variant={"h4"}>
                  {companyExperience.company}
                </Typography>
                <Typography variant={"body2"}>
                  {getCompanyDuration(companyExperience)}
                </Typography>
                <Timeline position={"right"} sx={{
                  // Each item gets a ::before spacer that flexes to fill the
                  // space a TimelineOppositeContent would take, which centres
                  // the timeline in the card. There is no opposite content
                  // here, so it is collapsed to keep the items left-aligned.
                  //
                  // The doubled `&` is a specificity bump, not a typo. @mui/lab
                  // 9 guards that spacer with
                  // `&:not(:has(.MuiTimelineOppositeContent-root))::before`,
                  // and the :has() argument counts toward specificity, so the
                  // library rule and a single-`&` override both land on (0,2,0).
                  // Timeline's sx is injected before its children's styles, so
                  // that tie breaks on source order in the library's favour --
                  // it rendered a 388px gap. Lab 6 used a plain `&::before` at
                  // (0,1,0), which is why this only needed one `&` before.
                  [`&& .${timelineItemClasses.root}::before`]: {
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
          { } {t('cv.certifications')}
        </SectionHeader>
        <Grid container spacing={2}>
          {certifications.map((cert, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <CertificationCard elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {cert.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {dateToString(cert.date)}
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
          { } {t('cv.education.header')}
        </SectionHeader>
        {education.map((edu, index) => (
            <StyledPaper key={index} elevation={3}>
              <Stack spacing={1}>
                <Typography variant="h5">{t(`cv.education.${edu.key}.degree`)}</Typography>
                <Typography color="textSecondary" variant="caption">{t(`cv.education.${edu.key}.institution`)}</Typography>
                <Typography color="textSecondary" variant="caption" gutterBottom>
                  {dateToString(edu.startDate)} {t("cv.to")} {dateToString(edu.endDate)}
                </Typography>
                <Typography color="textSecondary" variant="body2">{t(`cv.education.${edu.key}.description`)}</Typography>
              </Stack>
            </StyledPaper>
        ))}
      </>
  );
};

export default CV;
