import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AppBar,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import MenuIcon from "@mui/icons-material/Menu";
import LanguageIcon from "@mui/icons-material/Language";
import {
  BrowserView,
  MobileView,
  isBrowser,
  isMobile,
} from "react-device-detect";
import { useNavigate } from "react-router-dom";
import { NavigationData } from "../App";

// The translation key for a nav path: "/cv" -> "cv", "/pages/" -> "pages".
const navKey = (path: string) => path.replace(/\//g, "");

interface NavbarProps {
  navBarData: NavigationData[];
  darkEnabled: boolean;
  setDarkMode: () => void;
}

const Navbar = (props: NavbarProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const toggleLanguage = () => {
    // Compare on the BASE language, never the raw value. A browser reporting
    // "nb-NO" made the old `i18n.language == "nb"` check false, so the toggle
    // set Norwegian again and English was unreachable until you had clicked
    // enough times to walk the language through nb-NO -> nb -> en.
    const current = i18n.resolvedLanguage ?? i18n.language ?? "";
    const isNorwegian = current.toLowerCase().startsWith("nb");
    i18n.changeLanguage(isNorwegian ? "en" : "nb");
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openNavMenu = Boolean(anchorEl);
  const handleToggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!openNavMenu) {
      setAnchorEl(event.currentTarget);
    } else {
      handleClose();
    }
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleNavigate = (item: NavigationData) => {
    handleClose();
    if (item.external) {
      window.location.assign(item.path);
    } else {
      navigate(item.path);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          background: props.darkEnabled
            ? "#272A2F"
            : theme.palette.background.default,
          height: "4em",
        }}
        elevation={0}
      >
        <Toolbar>
          <BrowserView style={{ width: "100%" }}>
            <div
              style={{
                justifyContent: "center",
                display: "flex",
                width: "100%",
              }}
            >
              {props.navBarData
                .map((item) => item.path)
                .map((value, index) => {
                  return (
                    <Link
                        key={index}
                      to={props.navBarData[index].path}
                      reloadDocument={props.navBarData[index].external}
                      style={{
                        textDecoration: "none",
                        color: theme.palette.text.primary,
                      }}
                    >
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{
                          marginLeft: "1.5em",
                          "&:hover": { color: theme.palette.primary.main },
                        }}
                        key={index}
                      >
                        <b>
                          {t(`${navKey(props.navBarData[index].path)}.header`)}
                        </b>
                      </Typography>
                    </Link>
                  );
                })}
            </div>
          </BrowserView>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
            }}
          >
            <IconButton onClick={() => props.setDarkMode()}>
              {props.darkEnabled && (
                <LightModeIcon style={{ color: theme.palette.text.primary }} />
              )}
              {!props.darkEnabled && (
                <DarkModeIcon style={{ color: theme.palette.text.primary }} />
              )}
            </IconButton>
            <IconButton onClick={toggleLanguage}>
              <LanguageIcon
                style={{ color: theme.palette.text.primary }}
              />
            </IconButton>
            <MobileView>
              <IconButton onClick={handleToggleMenu}>
                <MenuIcon />
              </IconButton>
            </MobileView>
          </div>
        </Toolbar>
      </AppBar>
      <Toolbar sx={{ height: "4em" }} />
      {openNavMenu && (
        <Box
          sx={{
            zIndex: "100",
            width: "100%",
            background: props.darkEnabled
              ? "#272A2F"
              : theme.palette.background.default,
            position: "fixed",
          }}
        >
          <List>
            {props.navBarData
              .map((item) => item.path)
              .map((value, index) => {
                return (
                  <ListItem disablePadding divider key={index}>
                    <ListItemButton
                      onClick={() => handleNavigate(props.navBarData[index])}
                    >
                      <ListItemText
                        primary={t(
                          `${navKey(props.navBarData[index].path)}.header`,
                        )}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default Navbar;
