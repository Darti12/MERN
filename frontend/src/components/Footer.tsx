import { Divider, Paper, Typography, useTheme } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

interface FooterProps {
  darkEnabled: boolean;
}
const Footer = (props: FooterProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <div
      style={{
        justifyContent: "center",
        justifyItems: "center",
        alignContent: "center",
        gridRowGap: "1em",
        display: "grid",
        bottom: 0,
        width: "100%",
        height: "20vh",
      }}
    >
      <Divider sx={{ width: "80vw", color: "black" }} />
      <Typography
        sx={{ color: theme.palette.primary.main }}
        variant="h4"
        component="div"
        key={"home"}
      >
        {t(`footer.header`)}
      </Typography>
      {t(`footer.info`)}
    </div>
  );
};

export default Footer;
