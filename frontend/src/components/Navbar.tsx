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
import { useLogout } from "../hooks/useLogout";
import { useTranslation } from "react-i18next";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import MenuIcon from "@mui/icons-material/Menu";
import LanguageIcon from "@mui/icons-material/Language";
import { useGetUser } from "../hooks/useGetUser";
import {
  BrowserView,
  MobileView,
  isBrowser,
  isMobile,
} from "react-device-detect";
import { useNavigate } from "react-router-dom";
import { NavigationData } from "../App";

interface NavbarProps {
  navBarData: NavigationData[];
  darkEnabled: boolean;
  setDarkMode: () => void;
}

const Navbar = (props: NavbarProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { logoutUser } = useLogout();

  const { user } = useGetUser();
  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  const toggleLanguage = () => {
    if (i18n.language == "nb") {
      i18n.changeLanguage("en-US");
    } else {
      i18n.changeLanguage("nb");
    }
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
  const handleNavigate = (url: string) => {
    handleClose();
    navigate(`${url}`);
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
                          {t(
                            `${props.navBarData[index].path.substring(
                              1,
                            )}.header`,
                          )}
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
                      onClick={() =>
                        handleNavigate(props.navBarData[index].path)
                      }
                    >
                      <ListItemText
                        primary={t(
                          `${props.navBarData[index].path.substring(1)}.header`,
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
