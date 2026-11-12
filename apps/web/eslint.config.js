import next from "@repo/eslint-config/next";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig(next, {
  files: ["e2e/**/*.ts", "*.config.{js,mjs,ts}"],
  languageOptions: { globals: globals.node },
});
