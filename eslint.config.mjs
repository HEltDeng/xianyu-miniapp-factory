import js from "@eslint/js";
import ts from "typescript-eslint";
export default ts.config(
  { ignores: ["dist/**", "node_modules/**", ".runtime/**"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.mjs", "**/*.js"],
    languageOptions: {
      globals: {
        URLSearchParams: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        structuredClone: "readonly",
        fetch: "readonly",
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        alert: "readonly",
        confirm: "readonly",
        wx: "readonly",
        Page: "readonly",
        App: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        getApp: "readonly",
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-control-regex": "off",
    },
  },
);
