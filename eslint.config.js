import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "public/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.tsx"],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: ["src/**/*.{ts,tsx}", "vite.config.ts"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // The TypeScript-aware rule replaces the base rule for typed files.
      "no-unused-vars": "off",
      // This regex intentionally groups combining marks for Arabic text.
      "no-misleading-character-class": "off",
      // Review hook dependency warnings separately; changing them can alter behavior.
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
    },
  },
  {
    files: ["src/**/*.tsx"],
    rules: {
      // Existing interaction patterns need product-level accessibility decisions.
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
    },
  },
);
