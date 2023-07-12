import {BrowserRouter, Route, Routes} from "react-router-dom";

//pages and components
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import React from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";

const App = () => {
    return (
        <div>
            <BrowserRouter>
                <Navbar/>
                <div>
                    <Routes>
                        <Route path="/" element={<Home/>}/>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/signup" element={<Register/>}/>
                    </Routes>
                </div>
            </BrowserRouter>
        </div>
    );
}

export default App;
