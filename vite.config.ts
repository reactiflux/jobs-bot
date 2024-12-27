import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  // or cloudflare, deno, etc.
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  server: {
    port: 3000,
    origin: "localhost:3000",
  },
  plugins: [
    tsconfigPaths(),
    remix({
      ignoredRouteFiles: [".*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
      future: {
        unstable_optimizeDeps: true,
        v3_relativeSplatPath: true,
        v3_fetcherPersist: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
        v3_throwAbortReason: true,
        v3_routeConfig: true,
      },
    }),
  ],
});
