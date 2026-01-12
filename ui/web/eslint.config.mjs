import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rules to allow flexibility during development
  {
    rules: {
      // Allow explicit any for flexibility with third-party libraries
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      // Relax React hooks rules to warnings
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      // Allow img elements (Next.js Image not always needed)
      "@next/next/no-img-element": "warn",
      // Allow unescaped entities
      "react/no-unescaped-entities": "warn",
      // Prefer const is a style preference
      "prefer-const": "warn",
      // Allow empty interfaces extending other types
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
]);

export default eslintConfig;
