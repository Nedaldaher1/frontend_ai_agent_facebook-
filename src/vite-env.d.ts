/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the admin (NestJS) backend API. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
