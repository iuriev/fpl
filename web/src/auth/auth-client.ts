/**
 * Auth client for sign-in/sign-up/sign-out and team ID persistence.
 * Direct async functions; no React dependency.
 */

export type SubscriptionTier = 'free' | 'premium';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  fplTeamId: number | null;
  emailVerified: boolean;
  subscriptionTier: SubscriptionTier;
}

export interface AuthError {
  message: string;
  statusCode?: number;
}

const API_BASE = '/api';

function throwError(message: string, statusCode?: number): never {
  throw { message, statusCode } as AuthError;
}

async function makeRequest<T>(
  method: string,
  endpoint: string,
  body?: Record<string, unknown>
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throwError(error.message || `HTTP ${response.status}`, response.status);
    }

    return response.json();
  } catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err as AuthError;
    }
    throwError('Network error');
  }
}

export const authClient = {
  signIn: (email: string, password: string): Promise<AuthUser> =>
    makeRequest<AuthUser>('POST', '/auth/sign-in/email', { email, password }),

  signUp: (email: string, password: string, name: string): Promise<AuthUser> =>
    makeRequest<AuthUser>('POST', '/auth/sign-up/email', { email, password, name }),

  signOut: (): Promise<void> =>
    makeRequest<void>('POST', '/auth/sign-out', {}),

  getMe: (): Promise<AuthUser> =>
    makeRequest<AuthUser>('GET', '/me'),

  saveTeam: (teamId: number): Promise<{ fplTeamId: number }> =>
    makeRequest<{ fplTeamId: number }>('PUT', '/me/team', { teamId }),

  requestPasswordReset: (email: string): Promise<void> =>
    makeRequest<void>('POST', '/auth/request-password-reset', {
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    }),

  resetPassword: (token: string, newPassword: string): Promise<void> =>
    makeRequest<void>('POST', '/auth/reset-password', { token, newPassword }),
};
