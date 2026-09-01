import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  define: {
    __STEWIE_DESKTOP__: "true",
  },
  publicDir: "../public",
  plugins: [react()],
});
