/// <reference types="vite/client" />

interface ImportMetaEnv {
  // LOCAL DEV ONLY - comment after local dev is done
  //readonly VITE_ADMIN_USER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}