import React from "react";
import { Link } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  SvgIcon,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useLogout } from "../hooks/useLogout";
import { useGetUser } from "../hooks/useGetUser";
import styled from "styled-components";

const StyledLink = styled(Link)`
  text-decoration: none;
  color: white;

  &:focus,
  &:hover,
  &:visited,
  &:link,
  &:active {
    text-decoration: none;
  }
`;

interface NavbarProps {
  navBarheaders: string[];
  navBarPaths: string[];
}

const Navbar = (props: NavbarProps) => {
  const { logoutUser } = useLogout();
  const { user } = useGetUser();
  const handleLogout = () => {
    logoutUser();
    console.log("hei", user);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            component={Link}
            to="/"
          >
            <img src={"logo.svg"} alt={"Logo"} width={"50px"} height={"auto"} />
          </IconButton>
          {props.navBarheaders.map((value, index) => {
            return (
              <Typography
                variant="h5"
                component="div"
                sx={{ marginLeft: "1.5em" }}
              >
                <Link
                  to={props.navBarPaths[index]}
                  style={{ textDecoration: "none", color: "black" }}
                >
                  <b>{value}</b>
                </Link>
              </Typography>
            );
          })}
          <Divider
            orientation={"vertical"}
            variant={"middle"}
            sx={{ marginRight: "1em", marginLeft: "auto" }}
            flexItem
          />
          {user && (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          )}
          {!user && (
            <>
              <Button color="inherit">
                <StyledLink to="/login">Login</StyledLink>{" "}
              </Button>
              <Button color="inherit">
                <StyledLink to="/signup">Signup</StyledLink>
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
