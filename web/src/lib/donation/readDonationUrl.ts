export const DEFAULT_MONOBANK_JAR_URL = 'https://send.monobank.ua/jar/7UQvnCDwx8';

function parseHttpUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.href;
  } catch {
    return null;
  }
}

export function readDonationUrl(env: ImportMetaEnv = import.meta.env): string | null {
  if (env.VITE_DONATION_ENABLED === 'false') return null;

  const configured = env.VITE_DONATION_URL?.trim();
  const raw = configured === '' ? null : configured ?? DEFAULT_MONOBANK_JAR_URL;
  if (!raw) return null;

  return parseHttpUrl(raw);
}
