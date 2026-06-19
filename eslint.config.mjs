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
  {
    rules: {
      // Regras novas e estritas do plugin react-hooks (era React Compiler).
      // Elas sinalizam padroes que funcionam na pratica (flag de "montado" pra
      // hidratacao, sincronizar props->estado, reagir ao resultado de server
      // action). Mantidas como "warn" pra nao bloquear o CI sem precisar
      // refatorar componentes em producao as cegas. Revisar ao adotar o
      // React Compiler.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      // Nas paginas de erro usamos <a> de proposito (reload completo recupera
      // o app de um estado quebrado) — manter como aviso, nao erro.
      "@next/next/no-html-link-for-pages": "warn",
      // Permite parametros/variaveis iniciados com "_" (intencionalmente nao usados).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
