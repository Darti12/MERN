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
} from "@mui/material";
import { amber, indigo } from "@mui/material/colors";
import { isBrowser } from "react-device-detect";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CV from "./pages/CV";
import Footer from "./components/Footer";
import Chat from "./pages/Chat";

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
          <div
            style={{
              width: isBrowser ? "75%" : "90%",
              margin: "auto",
              marginTop: "3em",
              minHeight: "30em",
            }}
          >
            <Routes>
              {/*//official pages*/}
              <Route index element={<Navigate to={"/about"} />} />
              <Route path={"about"} element={<About />} />
              <Route path={"projects"} element={<Projects />} />
              <Route path={"contact"} element={<Contact />} />
              <Route path={"cv"} element={<CV />} />


              <Route element={<RequireUser user={user!!} />}>
                <Route path={"chat"} element={<Chat />} />
                <Route path={"chat/:id"} element={<Chat />} />
              </Route>

              {/*//admin pages*/}
              <Route path={"/admin"} element={<RequireUser user={user!!} />}>
                <Route index element={<Home />} />
                <Route path={"workouts"} element={<Workouts />} />
                <Route path={"projects"} element={<Projects />} />
              </Route>

              {/*//unnecessary pages, just for testing*/}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Register />} />
              <Route path="/test" element={<Test />} />
            </Routes>
          </div>
          <Footer darkEnabled={!light} />
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
};

export default App;
