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

    // Not ours to lint. `npm run lint` was reporting errors from JavaScript bundled inside
    // PyTorch under .venv-photo and from a vendored demo repo in .tmp, which buried the handful
    // of findings that are actually about this codebase.
    ".venv-photo/**",
    ".tmp/**",
    "apps/**",
  ]),
]);

export default eslintConfig;
