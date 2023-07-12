import React from "react";
import {Link} from "react-router-dom";
import {AppBar, Box, Button, IconButton, Toolbar, Typography} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = () => {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                        <Link to="/" style={{ textDecoration: 'none', color: "black" }}>
                            <b>Workout buddy</b>
                        </Link>
                    </Typography>
                    <Button color="inherit"><Link to="/login">Login</Link> </Button>
                    <Button color="inherit"><Link to="/signup">Signup</Link></Button>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default Navbar;
