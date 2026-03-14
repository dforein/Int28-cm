/// <reference types="vite/client" />

interface ImportMetaEnv {
  // No VITE_ variables needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
