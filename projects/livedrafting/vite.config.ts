import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    include: ["adacad-drafting-lib", "esbuild-wasm"],
  },
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
        about: "./about.html",
      },
    },
    commonjsOptions: {
      include: [/adacad-drafting-lib/, /node_modules/],
    },
  },
});
