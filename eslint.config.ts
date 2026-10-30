import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginPrettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: { globals: globals.browser },
  },

  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  configPrettier,
  { files: ["**/*.jsonc"], plugins: { json }, language: "json/jsonc" },
  { files: ["**/*.json5"], plugins: { json }, language: "json/json5" },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/commonmark",
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      // External links keep the referrer on purpose (outbound attribution).
      "react/jsx-no-target-blank": ["error", { allowReferrer: true }],
      "prettier/prettier": "error",
    },
  },
]);
