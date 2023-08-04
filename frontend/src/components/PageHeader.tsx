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
    <Typography
      sx={{ color: theme.palette.primary.main }}
      variant="h4"
      component="div"
      key={"home"}
    >
      {t(`${path}.header`)}
    </Typography>
  );
};

export default PageHeader;
