import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tanstackStart({
      server: {
        entry: "./src/server.ts",
      },
    }),
    viteReact(),
  ],
  vite: {
    resolve: {
      alias: {
        "node:async_hooks": resolve(__dirname, "src/lib/async-hooks-polyfill.ts"),
        "@tanstack/start-storage-context": resolve(
          __dirname,
          "src/lib/start-storage-polyfill.ts",
        ),
      },
    },
  },
});
