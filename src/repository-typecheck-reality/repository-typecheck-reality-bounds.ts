/**
 * Repository Typecheck Reality — bounded limits and pass tokens.
 */

export const REPOSITORY_TYPECHECK_REALITY_PASS_TOKEN = 'REPOSITORY_TYPECHECK_REALITY_PASS';
export const REPOSITORY_TYPECHECK_REALITY_OWNER_MODULE = 'aidevengine_repository_typecheck_reality';
export const MAX_TYPECHECK_FINDINGS = 32;
export const MAX_TYPECHECK_HISTORY = 12;
export const TYPECHECK_COMMAND = 'npm run typecheck';
export const NPM_TYPECHECK_SCRIPT = 'typecheck';
export const MAX_TYPECHECK_OUTPUT_SUMMARY_CHARS = 4096;
export const REPOSITORY_TYPECHECK_REALITY_REPAIR_V1_PASS =
  'REPOSITORY_TYPECHECK_REALITY_REPAIR_V1_PASS';
export const REPOSITORY_TYPECHECK_CACHE_KEY_PREFIX = 'repository-typecheck-reality-v1';

export const REPOSITORY_TYPECHECK_PROOF_NOTES = [
  'Feature behavior is not proof of repository integrity.',
  'Validator pass is not proof of full compile readiness.',
  'Full launch readiness requires a clean repository typecheck baseline.',
] as const;
