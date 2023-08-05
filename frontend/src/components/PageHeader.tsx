import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Typography, useTheme } from "@mui/material";
import React from "react";

const PageHeader = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const theme = useTheme();
  const path = location.pathname.substring(1);

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <Typography
        variant={"h1"}
        fontStyle={"bold"}
        fontFamily={""}
        sx={{ marginLeft: "auto", marginRight: "auto", marginBottom: "100px" }}
      >
        {t(`${path}.title`)}
      </Typography>
    </div>
  );
};

export default PageHeader;
