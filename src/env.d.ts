declare module '*.css';

interface ImportMetaEnv {
  readonly VITE_LEARNING_API_URL?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'virtual:typescript-libraries' {
  export const typeScriptLibraries: Record<string, string>;
}
