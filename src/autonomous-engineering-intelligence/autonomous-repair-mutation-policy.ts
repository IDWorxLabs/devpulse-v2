/**
 * Autonomous Engineering Intelligence V1 — mutation boundary policy.
 */

export const MUTATION_ALLOWLIST_PREFIXES = [
  'src/features/',
  'src/universal-crud-generation-engine/',
  'src/universal-action-materialization-engine/',
  'src/universal-workflow-generation-engine/',
  'src/universal-relationship-intelligence-engine/',
  'src/universal-runtime-state-engine/',
  'src/universal-business-rule-engine/',
  'src/universal-capability-packs/',
  'src/universal-behavioral-verification/',
  'src/universal-capability-coverage/',
  'src/universal-capability-composition-engine/',
  'src/universal-production-readiness/',
  'src/autonomous-engineering-intelligence/',
] as const;

export const MUTATION_DENYLIST_PATTERNS = [
  /approved-production-build-envelope/i,
  /canonical-product-contract/i,
  /feature-contract/i,
  /package-lock\.json$/,
  /\.env$/,
  /node_modules/,
] as const;

export function isMutationPathAllowed(relativePath: string): boolean {
  if (MUTATION_DENYLIST_PATTERNS.some((p) => p.test(relativePath))) return false;
  return MUTATION_ALLOWLIST_PREFIXES.some((p) => relativePath.startsWith(p));
}

export function detectForbiddenConstitutionalMutation(targetPath: string): boolean {
  return MUTATION_DENYLIST_PATTERNS.some((p) => p.test(targetPath));
}
