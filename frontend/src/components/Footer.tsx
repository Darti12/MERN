import { Divider, Paper, Typography, useTheme } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { format } from 'date-fns';

interface FooterProps {
  darkEnabled: boolean;
}
const Footer = (props: FooterProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
    const currentYear = format(new Date(), 'yyyy');

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
              marginTop: "3em",
          }}
      >
          <Divider sx={{width: "80vw", color: "black"}}/>
          <Typography
              sx={{color: theme.palette.primary.main}}
              variant="h4"
              component="div"
              key={"home"}
          >
              {t(`footer.header`)}
          </Typography>
          © {currentYear} Filip Hagen. All Rights Reserved.
      </div>
  );
};

export default Footer;
