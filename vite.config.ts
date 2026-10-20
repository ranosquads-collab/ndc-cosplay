import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  vite: {
    plugins: [nitro({ preset: "vercel" })],
    server: {
      host: "0.0.0.0",
      port: 3000,
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
