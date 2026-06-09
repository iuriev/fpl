/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PREMIUM_UPSELL_ENABLED?: string;
  readonly VITE_PREMIUM_UPSELL_COOLDOWN_MS?: string;
readonly VITE_DONATION_ENABLED?: string;
  readonly VITE_DONATION_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css';
