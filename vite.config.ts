import { cloudflare } from "@cloudflare/vite-plugin";
import contentCollections from "@content-collections/remix-vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
    }),
    tailwindcss(),
    reactRouter(),
    contentCollections(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    open: false,
    port: 3000,
    allowedHosts: ["wholehearted-eleanor-nocturnal.ngrok-free.dev"],
  },
  build: {
    minify: true,
  },
});
