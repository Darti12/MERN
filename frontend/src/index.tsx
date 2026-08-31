import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { store } from "./store";
import { Provider } from "react-redux";
import { disableReactDevTools } from "@fvilers/disable-react-devtools";

// import i18n (needs to be bundled ;))
import "./i18n";

// import.meta.env.PROD is Vite's built-in production-build flag -- the
// direct replacement for the old `process.env.REACT_APP_NODE_ENV ===
// "production"` check, which was CRA-specific and, since REACT_APP_NODE_ENV
// was never actually set anywhere in this repo, never fired.
if (import.meta.env.PROD) {
  disableReactDevTools();
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");
const root = createRoot(rootElement);
root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
