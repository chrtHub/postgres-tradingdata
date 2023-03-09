// https://typescript-eslint.io/getting-started

module.export = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
};

// module.exports = {
//   env: {
//     browser: true,
//     es2021: true,
//   },
//   extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
//   overrides: [],
//   parser: "@typescript-eslint/parser",
//   parserOptions: {
//     ecmaVersion: "latest",
//     sourceType: "module",
//   },
//   plugins: ["@typescript-eslint"],
//   //-- testing
//   rules: {
//     "import/extensions": [
//       "error",
//       "ignorePackages",
//       {
//         ts: "never",
//         tsx: "never",
//         js: "never",
//         jsx: "never",
//       },
//     ],
//   },
// };
