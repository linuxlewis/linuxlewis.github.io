import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://sambolgert.com",
  vite: {
    server: {
      proxy: {
        "/data/token-usage.json": {
          target: "https://web.sambolgert.com",
          changeOrigin: true,
        },
      },
    },
  },
});
