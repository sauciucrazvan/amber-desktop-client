import { defineConfig } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  // Electron production loads the renderer via file://, so absolute /asset URLs break.
  // Using a relative base ensures scripts/styles resolve correctly from dist/index.html.
  base: "./",
  define: {
    global: "globalThis",
  },
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: "electron/main.ts",
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, "electron/preload.ts"),
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("react") || id.includes("scheduler")) {
            return "vendor-react";
          }

          if (id.includes("@radix-ui") || id.includes("lucide-react")) {
            return "vendor-ui";
          }

          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "vendor-i18n";
          }

          if (id.includes("swr")) {
            return "vendor-data";
          }
        },
      },
    },
  },
});
