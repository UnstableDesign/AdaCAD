import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    include: ["adacad-drafting-lib"],
  },
  build: {
    commonjsOptions: {
      include: [/adacad-drafting-lib/, /node_modules/],
    },
  },
});
