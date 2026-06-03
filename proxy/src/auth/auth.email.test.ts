import { beforeEach, describe, expect, it, vi } from 'vitest';

type SendFn = (...args: unknown[]) => unknown;
type SendVerificationEmailFn = (args: { user: { email: string }; url: string }) => Promise<void>;

const hoisted = vi.hoisted(() => ({
  mockSend: vi.fn(),
  captured: {} as { sendVerificationEmail?: SendVerificationEmailFn },
}));

vi.mock('resend', () => ({
  Resend: function Resend(this: unknown) {
    return { emails: { send: (...args: Parameters<SendFn>) => hoisted.mockSend(...args) } };
  },
}));

vi.mock('../db/client', () => ({
  db: {},
  runMigrations: vi.fn(),
}));

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn(() => ({})),
}));

vi.mock('better-auth', () => ({
  betterAuth: vi.fn((config: { emailVerification?: { sendVerificationEmail: SendVerificationEmailFn } }) => {
    hoisted.captured.sendVerificationEmail = config.emailVerification?.sendVerificationEmail;
    return {
      handler: vi.fn(),
      api: {},
      $Infer: { Session: { user: {} } },
    };
  }),
}));

import './auth';

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.mockSend.mockResolvedValue({ data: null, error: null });
});

describe('emailVerification plugin — sendVerificationEmail callback', () => {
  it('calls Resend.emails.send with user email and verification URL', async () => {
    await hoisted.captured.sendVerificationEmail!({
      user: { email: 'user@example.com' },
      url: 'https://fpl-squad-viewer.fly.dev/api/auth/verify-email?token=abc123',
    });

    expect(hoisted.mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Verify your FPL Squad Viewer email',
      })
    );
  });

  it('includes the verification URL in the email body', async () => {
    const verifyUrl = 'https://fpl-squad-viewer.fly.dev/api/auth/verify-email?token=xyz';

    await hoisted.captured.sendVerificationEmail!({
      user: { email: 'test@example.com' },
      url: verifyUrl,
    });

    expect(hoisted.mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(verifyUrl),
      })
    );
  });
});
