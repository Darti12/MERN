import { BrowserRouter, Route, Routes } from "react-router-dom";

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

const App = () => {
  const { user } = useGetUser();

  const navBarHeaders: string[] = ["Workouts", "Projects", "Test"];
  const navBarPaths: string[] = ["/workouts", "/projects", "/test"];

  return (
    <div>
      <BrowserRouter>
        <Navbar navBarHeaders={navBarHeaders} navBarPaths={navBarPaths} />
        <div>
          <Routes>
            <Route path={"/"} element={<RequireUser user={user!!} />}>
              <Route index element={<Home />} />
              <Route path={"workouts"} element={<Workouts />} />
              <Route path={"projects"} element={<Projects />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/test" element={<Test />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
};

export default App;
