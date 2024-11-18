import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

//pages and components
import Navbar from "./components/Navbar";
import React from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useGetUser } from "./hooks/useGetUser";
import RequireUser from "./components/RequireUser";
import Projects from "./pages/Projects";
import Workouts from "./pages/Workouts";
import Home from "./pages/Home";
import Test from "./pages/Test";
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
import {usePingServerMutation} from "./api/authApi";
import ScrollToTop from "./components/ScrollToTop";

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
  const { user } = useGetUser();
  const [light, setLight] = React.useState(true);
  const [pingServer] = usePingServerMutation();

  React.useEffect(() => {
    pingServer();
  }, []);

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

                {/*<Route element={<RequireUser user={user!!} />}>*/}
                  <Route path={"chat"} element={<Chat />} />
                  <Route path={"chat/:id"} element={<Chat />} />
                {/*</Route>*/}

                <Route path={"/admin"} element={<RequireUser user={user!!} />}>
                  <Route index element={<Home />} />
                  <Route path={"workouts"} element={<Workouts />} />
                  <Route path={"projects"} element={<Projects />} />
                </Route>

                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/test" element={<Test />} />
              </Routes>
            </Container>
            <Footer darkEnabled={!light} />
          </ThemeProvider>
        </BrowserRouter>
      </div>
  );
};

export default App;
