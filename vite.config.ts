/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  base: "/bullet-survivor-game/",
  test: {
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
