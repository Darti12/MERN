import React from "react";
import PageHeader from "../components/PageHeader";
import { Avatar, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  BrowserView,
  MobileView,
  isBrowser,
  isMobile,
} from "react-device-detect";

const About = () => {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "2em",
        }}
      >
        <Avatar
          alt={"Filip Hagen "}
          src={"/assets/profile.jpg"}
          sx={{
            width: isMobile ? "80vw" : "13em",
            height: isMobile ? "80vw" : "13em",
            marginLeft: isMobile ? "auto" : "0",
            marginRight: isMobile ? "auto" : "0",
          }}
        />
        <div style={{ width: "20em" }}>
          <Typography variant={"h5"} sx={{ fontStyle: "bold" }}>
            {t("about.header1")}
          </Typography>
          <Typography sx={{ marginTop: "1em", marginBottom: "1em" }}>
            {t("about.text1")}
          </Typography>
          <Typography>{t("about.text2")}</Typography>
        </div>
      </div>
    </>
  );
};

export default About;
