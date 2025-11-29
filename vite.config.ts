import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Custom plugin required by the FHE guide to fix CommonJS imports inside the SDK bundle
const fixCommonJSImports = () => ({
  name: "fix-commonjs-imports",
  transform(code: string, id: string) {
    if (id.includes("@zama-fhe/relayer-sdk/lib/web.js")) {
      let fixed = code;

      fixed = fixed.replace(
        /import\s+(\w+)\s+from\s+['"]keccak['"]/g,
        "import * as $1Module from 'keccak'; const $1 = $1Module.default || $1Module",
      );

      fixed = fixed.replace(
        /import\s+(\w+)\s+from\s+['"]fetch-retry['"]/g,
        "import * as $1Module from 'fetch-retry'; const $1 = $1Module.default || $1Module",
      );

      return { code: fixed, map: null };
    }

    return null;
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), fixCommonJSImports(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    exclude: ["@zama-fhe/relayer-sdk"],
    include: ["keccak", "fetch-retry"],
    esbuildOptions: {
      target: "esnext",
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    target: "esnext",
    commonjsOptions: {
      include: [/keccak/, /fetch-retry/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
}));
