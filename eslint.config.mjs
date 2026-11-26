import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: ["next.config.mjs", ".next/**", "node_modules/**", "public/**"],
  },
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      // React 19 / React Compiler rules from eslint-plugin-react-hooks v7 (app uses React 18)
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      "react-hooks/error-boundaries": "off",
    },
  },
];

export default eslintConfig;
