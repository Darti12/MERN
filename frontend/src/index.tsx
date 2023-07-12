import * as React from "react";
import {createRoot} from "react-dom/client";
import "./index.css";
import App from "./App";
import {store} from "./store";
import {Provider} from "react-redux";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');
const root = createRoot(rootElement);
root.render(
    <Provider store={store}>
        <App/>
    </Provider>
)



