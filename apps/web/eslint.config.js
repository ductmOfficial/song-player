import next from "@repo/eslint-config/next";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

export default defineConfig(globalIgnores(["public/sw.js", "public/swe-worker-*.js"]), next, {
  files: ["e2e/**/*.ts", "*.config.{js,mjs,ts}"],
  languageOptions: { globals: globals.node },
});
