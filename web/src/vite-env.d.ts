/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PREMIUM_UPSELL_ENABLED?: string;
  readonly VITE_PREMIUM_UPSELL_COOLDOWN_MS?: string;
  readonly VITE_PREMIUM_DEV_IS_PREMIUM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css';
