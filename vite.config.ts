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
      // Keep published package declarations in the editor's virtual filesystem.
      // No package JavaScript is bundled or executed by this plugin.
      const packages = new Map<string, string>();
      function addPackage(name: string, from: string) {
        const packageRequire = createRequire(from);
        let entryPath: string;
        try {
          entryPath = packageRequire.resolve(`${name}/package.json`);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error;
          entryPath = packageRequire.resolve(name);
        }
        let directory = path.dirname(entryPath);
        while (!fs.existsSync(path.join(directory, 'package.json'))) {
          const parent = path.dirname(directory);
          if (parent === directory) throw new Error(`Missing package metadata: ${name}`);
          directory = parent;
        }
        const metadataPath = path.join(directory, 'package.json');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        if (packages.has(name)) {
          if (packages.get(name) !== metadata.version) throw new Error(`Conflicting editor types: ${name}`);
          return;
        }
        packages.set(name, metadata.version);
        libraries[`/node_modules/${name}/package.json`] = JSON.stringify({
          name: metadata.name, version: metadata.version, type: metadata.type,
          types: metadata.types, typings: metadata.typings, exports: metadata.exports,
        });
        function collectDeclarations(relative = '') {
          for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
            if (entry.name === 'node_modules') continue;
            const file = path.posix.join(relative, entry.name);
            if (entry.isDirectory()) collectDeclarations(file);
            else if (entry.isFile() && file.endsWith('.d.ts')) {
              libraries[`/node_modules/${name}/${file}`] = fs.readFileSync(path.join(directory, file), 'utf8');
            }
          }
        }
        collectDeclarations();
        for (const dependency of Object.keys(metadata.dependencies ?? {})) addPackage(dependency, metadataPath);
      }
      for (const name of ['lit', '@lit/task', '@lit/context']) addPackage(name, path.join(process.cwd(), 'package.json'));
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
