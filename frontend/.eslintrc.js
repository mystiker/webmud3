module.exports = {
  ignorePatterns: ["projects/**/*"],
  plugins: ["simple-import-sort", "import"],
  overrides: [
    {
      files: ["*.ts"],
      parserOptions: {
        project: ["./tsconfig.app.json"],
        tsconfigRootDir: __dirname,
        sourceType: "module",
        ecmaVersion: "latest",
      },
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/strict-type-checked",
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates",
      ],
      rules: {
        "@angular-eslint/directive-selector": [
          "error",
          {
            type: "attribute",
            prefix: "app",
            style: "camelCase",
          },
        ],
        "@angular-eslint/component-selector": [
          "error",
          {
            type: "element",
            prefix: "app",
            style: "kebab-case",
          },
        ],
        eqeqeq: "error",
        "grouped-accessor-pairs": "warn",
        "guard-for-in": "error",
        "no-alert": "warn",
        "no-delete-var": "error",
        "no-duplicate-imports": "error",
        "no-empty-function": "warn",
        "no-implicit-coercion": "error",
        "no-implicit-globals": "error",
        "no-labels": "error",
        "no-shadow": "error",
        "no-unused-vars": "warn",
        "no-use-before-define": "error",
        "no-var": "error",
        "prefer-const": "warn",
        "simple-import-sort/imports": "warn",
        "simple-import-sort/exports": "warn",
        "import/first": "warn",
        "import/newline-after-import": "warn",
        "import/no-duplicates": "warn",
      },
    },
    {
      files: ["*.html"],
      extends: [
        "plugin:@angular-eslint/template/recommended",
        "plugin:@angular-eslint/template/accessibility",
      ],
      rules: {},
    },
  ],
};
