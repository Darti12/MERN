import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

//pages and components
import Navbar from "./components/Navbar";
import React from "react";
import Projects from "./pages/Projects";
import {
  createTheme,
  CssBaseline,
  responsiveFontSizes,
  ThemeProvider,
  Container
} from "@mui/material";
import { amber, indigo } from "@mui/material/colors";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CV from "./pages/CV";
import Footer from "./components/Footer";
import Chat from "./pages/Chat";
import ScrollToTop from "./components/ScrollToTop";
import PointCloud from "./components/PointCloud";

const lightTheme = createTheme({
  palette: {
    primary: amber,
    secondary: indigo,
    text: {
      primary: "#025A4E",
    },
    background: {
      default: "#EDE7DE",
    },
  },
});

const darkTheme = createTheme({
  palette: {
    primary: amber,
    secondary: indigo,
    text: {
      primary: "#8FDCC2",
    },
    background: {
      default: "#233831",
    },
    mode: "dark",
  },
});

export interface NavigationData {
  path: string;
  name: string;
}

const App = () => {
  const [light, setLight] = React.useState(true);

  const navBarData: NavigationData[] = [
    { name: "About", path: "/about" },
    { name: "Projects", path: "/projects" },
    { name: "Contact", path: "/contact" },
    { name: "CV", path: "/cv" },
    { name: "Chat", path: "/chat"}
  ];

  const toggleDarkMode = () => {
    setLight(!light);
  };

  return (
      <div>
        <BrowserRouter>
          <ThemeProvider
              theme={
                light
                    ? responsiveFontSizes(lightTheme)
                    : responsiveFontSizes(darkTheme)
              }
          >
            <CssBaseline />
            <Navbar
                navBarData={navBarData}
                darkEnabled={!light}
                setDarkMode={toggleDarkMode}
            />
            <PointCloud
                darkEnabled={true}
                maxDistance={150}
                pointSize={3}
                pointCount={30}
                speed={10}
            />
            <Container
                maxWidth="md"
                sx={{
                  mt: 4,
                  mb: 4,
                  minHeight: "calc(100vh - 64px - 20vh)", // Adjust based on your navbar and footer height
                  display: 'flex',
                  flexDirection: 'column',
                }}
            >
              <ScrollToTop />
              <Routes>
                <Route index element={<Navigate to={"/about"} />} />
                <Route path={"about"} element={<About />} />
                <Route path={"projects"} element={<Projects />} />
                <Route path={"projects/:id"} element={<Projects />} />
                <Route path={"contact"} element={<Contact />} />
                <Route path={"cv"} element={<CV />} />

                <Route path={"chat"} element={<Chat />} />
                <Route path={"chat/:id"} element={<Chat />} />
              </Routes>
            </Container>
            <Footer darkEnabled={!light} />
          </ThemeProvider>
        </BrowserRouter>
      </div>
  );
};

export default App;
