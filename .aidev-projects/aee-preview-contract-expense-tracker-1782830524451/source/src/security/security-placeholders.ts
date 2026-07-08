/** Security layer placeholders. Marker: data-blueprint="security" */
export const BLUEPRINT_SECURITY_MARKER = 'data-blueprint="security"';
export const SECURITY_FEATURES = {
  sessionManagement: true,
  passwordReset: true,
  emailVerification: true,
  rateLimiting: true,
  auditLogging: true,
} as const;

export function logSecurityAudit(_action: string): void {
  /* placeholder */
}
