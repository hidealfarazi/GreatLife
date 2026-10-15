import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  // Untouched React Bits reference copies (kept for comparison, not imported anywhere)
  { ignores: ["components/ui/*.origin.jsx"] },
  ...nextConfig,
  {
    rules: {
      // enforce Next.js + React best practices
    },
  },
];

export default config;
