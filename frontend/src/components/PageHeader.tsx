import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Typography, useTheme } from "@mui/material";
import React from "react";

interface PageHeaderProps {
    overrideHeader?: string | null;
}

const PageHeader = (props: PageHeaderProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const theme = useTheme();
  const path = location.pathname.substring(1);

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <Typography
        variant={"h2"}
        sx={{
          fontWeight: "bold",
          fontFamily: "",
          marginLeft: "auto",
          marginRight: "auto",
          marginBottom: "50px",
        }}
      >
          {props?.overrideHeader &&
              (
                  props?.overrideHeader
              )
          }
          {!props?.overrideHeader && path &&
              (
                  t(`${path}.title`)
              )
          }
      </Typography>
    </div>
  );
};

export default PageHeader;
