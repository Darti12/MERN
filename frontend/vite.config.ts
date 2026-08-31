import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
//
// ADR 0003: Vite replaces react-scripts as a like-for-like SPA bundler --
// the app stays a client-rendered SPA producing static output, so this file
// only configures a bundler, never a server runtime.
export default defineConfig({
  plugins: [react()],
  build: {
    // render.yaml (task `static`) declares staticPublishPath: frontend/build.
    // Keep this in sync with that value rather than Vite's "dist" default,
    // so the static host config doesn't also need to change.
    outDir: "build",
    // Never ship sourcemaps -- they publish the entire original source,
    // comments included, to anyone who fetches them. This was previously
    // enforced by CRA reading the GENERATE_SOURCEMAP=false env var; Vite's
    // equivalent is this build option, which defaults to false anyway, but
    // is set explicitly here so the intent survives a future Vite default
    // change. Fitness function f2 also greps the build output as a backstop.
    sourcemap: false,
  },
  server: {
    // Match CRA's default dev server port so existing local-dev muscle
    // memory (and any hardcoded http://localhost:3000 references) still work.
    port: 3000,
  },
});
