// Fallback for a path under /pages/ that reached the portfolio (ADR 0006).
// Pages are separate apps whose files Render serves directly, so normally
// this never renders. If the host's SPA rewrite answers first (a directory
// like /pages/oslo-weather/ that it didn't map to its index.html), load that
// index.html by its full name, which is a real file. A path that already
// names index.html and still got here doesn't exist.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Typography } from "@mui/material";

const PagesFallback = () => {
  const { pathname } = useLocation();
  const missing = pathname.endsWith("/index.html");

  useEffect(() => {
    if (!missing) {
      window.location.replace(`${pathname.replace(/\/?$/, "/")}index.html`);
    }
  }, [pathname, missing]);

  return missing ? <Typography variant="h5">This page doesn't exist.</Typography> : null;
};

export default PagesFallback;
