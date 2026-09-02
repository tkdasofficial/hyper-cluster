// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitLab Pages serves the site from https://celestialintelligence.gitlab.io/copilot.
// CI sets PUBLIC_BASE_PATH=/copilot/ ; locally the app stays at "/".
const base = process.env["PUBLIC_BASE_PATH"] || "/";

export default defineConfig({
  vite: {
    base,
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    // server entry override disabled during static prerender
    // Static export: every public route is rendered to HTML at build time so the
    // site can be served by a plain static host (GitLab Pages).
    pages: [
      { path: "/" },
      { path: "/image" },
      { path: "/video" },
      { path: "/audio" },
      { path: "/virtual-model" },
      { path: "/virtual-model/create-model" },
      { path: "/pricing" },
      { path: "/auth" },
      { path: "/terms" },
      { path: "/privacy" },
    ],
    prerender: { enabled: true, autoStaticPathsDiscovery: false },
  },
});
