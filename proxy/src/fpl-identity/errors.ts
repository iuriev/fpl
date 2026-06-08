import type { AuditIssue } from './types';

export class FplIdentityError extends Error {
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'FplIdentityError';
    this.code = code;
    this.details = details;
  }
}

export function auditFailedError(season: string, issues: AuditIssue[]): FplIdentityError {
  const errors = issues.filter((i) => i.severity === 'error');
  const summary = errors
    .slice(0, 5)
    .map((i) => i.code)
    .join(', ');
  return new FplIdentityError(
    'SEASON_AUDIT_FAILED',
    `FPL identity audit failed for ${season}: ${errors.length} error(s) (${summary}${errors.length > 5 ? ', …' : ''})`,
    { season, issues: errors },
  );
}
