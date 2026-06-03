import { describe, expect, it } from 'vitest';

import { DEFAULT_MONOBANK_JAR_URL, readDonationUrl } from './readDonationUrl';

describe('readDonationUrl', () => {
  it('returns the default Monobank jar when env is unset', () => {
    expect(readDonationUrl({} as ImportMetaEnv)).toBe(DEFAULT_MONOBANK_JAR_URL);
  });

  it('returns null when disabled', () => {
    expect(readDonationUrl({ VITE_DONATION_ENABLED: 'false' } as ImportMetaEnv)).toBeNull();
  });

  it('returns null for empty override URL', () => {
    expect(readDonationUrl({ VITE_DONATION_URL: '' } as ImportMetaEnv)).toBeNull();
    expect(readDonationUrl({ VITE_DONATION_URL: '   ' } as ImportMetaEnv)).toBeNull();
  });

  it('returns null for invalid override URL', () => {
    expect(readDonationUrl({ VITE_DONATION_URL: 'not-a-url' } as ImportMetaEnv)).toBeNull();
  });

  it('returns null for non-http(s) schemes', () => {
    expect(
      readDonationUrl({ VITE_DONATION_URL: 'javascript:alert(1)' } as ImportMetaEnv)
    ).toBeNull();
  });

  it('uses a valid override URL', () => {
    expect(
      readDonationUrl({ VITE_DONATION_URL: 'https://send.monobank.ua/jar/other' } as ImportMetaEnv)
    ).toBe('https://send.monobank.ua/jar/other');
  });
});
