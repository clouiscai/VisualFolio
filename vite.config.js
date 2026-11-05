import { defineConfig } from "vite";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
  // Vercel serves from the domain root; GitHub Pages serves from /VisualFolio/.
  base: process.env.VERCEL ? "/" : "/VisualFolio/",
  plugins: [
    {
      name: "copy-runtime-assets",
      closeBundle() {
        const source = resolve("assets");
        const target = resolve("dist/assets");

        if (existsSync(source)) {
          cpSync(source, target, { recursive: true });
        }
      },
    },
  ],
});
