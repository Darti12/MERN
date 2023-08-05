import React from "react";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();
  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <Typography
        variant={"h2"}
        fontStyle={"bold"}
        sx={{ marginLeft: "auto", marginRight: "auto" }}
      >
        {t("home.header")}
      </Typography>
      <br />
    </div>
  );
};

export default Home;
