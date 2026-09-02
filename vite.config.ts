import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'path';
import { createRequire } from 'node:module';
import {defineConfig, loadEnv} from 'vite';

const DEFAULT_LEARNING_API_URL = 'https://api.devt.lat';
const require = createRequire(import.meta.url);
const TYPE_SCRIPT_LIBS_ID = 'virtual:typescript-libraries';
const RESOLVED_TYPE_SCRIPT_LIBS_ID = `\0${TYPE_SCRIPT_LIBS_ID}`;

export function normalizeBuildSha(value: string | undefined): string {
  const candidate = value?.trim().toLowerCase() ?? '';
  return /^[a-f0-9]{40}$/.test(candidate) ? candidate : 'local';
}

export function buildIdentityPlugin(buildSha: string) {
  const safeBuildSha = normalizeBuildSha(buildSha);
  return {
    name: 'devt-build-identity',
    transformIndexHtml(html: string) {
      return html.replace(
        /(<meta\s+charset=["'][^"']+["']\s*\/>)/i,
        `$1\n    <meta name="devt-build-sha" content="${safeBuildSha}" />`,
      );
    },
  };
}

function typeScriptLibrariesPlugin() {
  return {
    name: 'aula-typescript-libraries',
    resolveId(id: string) {
      return id === TYPE_SCRIPT_LIBS_ID ? RESOLVED_TYPE_SCRIPT_LIBS_ID : null;
    },
    load(id: string) {
      if (id !== RESOLVED_TYPE_SCRIPT_LIBS_ID) return null;
      const packagePath = require.resolve('typescript/package.json');
      const libraryDirectory = path.join(path.dirname(packagePath), 'lib');
      const libraries = Object.fromEntries(
        fs.readdirSync(libraryDirectory)
          .filter((fileName) => /^lib\..+\.d\.ts$/.test(fileName))
          .map((fileName) => [
            `/${fileName}`,
            fs.readFileSync(path.join(libraryDirectory, fileName), 'utf8'),
          ]),
      );
      return `export const typeScriptLibraries = ${JSON.stringify(libraries)};`;
    },
  };
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), 'VITE_');
  const learningApiTarget = (environment.VITE_LEARNING_API_URL || DEFAULT_LEARNING_API_URL).replace(/\/$/, '');
  const buildSha = normalizeBuildSha(process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA);
  return {
    plugins: [buildIdentityPlugin(buildSha), typeScriptLibrariesPlugin(), react(), tailwindcss()],
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['import', 'global-builtin', 'color-functions'] as any,
        },
      },
    },
    worker: {
      // Pyodide loads its WebAssembly runtime as ES modules. IIFE workers cannot
      // represent that code-split graph, so every application Worker uses ESM.
      format: 'es' as const,
      plugins: () => [typeScriptLibrariesPlugin()],
    },
    test: {
      setupFiles: ['./src/test-setup.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: learningApiTarget,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api(?=\/|$)/, ''),
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
