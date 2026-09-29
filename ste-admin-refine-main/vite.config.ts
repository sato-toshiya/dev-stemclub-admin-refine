import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [svgr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
