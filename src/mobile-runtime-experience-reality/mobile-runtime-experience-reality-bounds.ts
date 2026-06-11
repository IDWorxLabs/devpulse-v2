/**
 * Mobile Runtime Experience Reality — runtime bounds (Phase 24C.5).
 */

export const MOBILE_RUNTIME_EXPERIENCE_REALITY_PASS_TOKEN =
  'MOBILE_RUNTIME_EXPERIENCE_REALITY_PASS';
export const MOBILE_RUNTIME_EXPERIENCE_REALITY_OWNER_MODULE =
  'aidevengine_mobile_runtime_experience_reality';

export const MAX_MOBILE_RUNTIME_EVIDENCE = 32;
export const MAX_MOBILE_RUNTIME_BLOCKERS = 12;
export const MAX_REGISTRY_ENTRIES = 16;
export const MAX_HISTORY_ENTRIES = 32;

/** Reality rules — never proof. */
export const MOBILE_RUNTIME_NEVER_PROOF = [
  'Phone image exists',
  'Phone frame exists',
  'Roadmap item exists',
  'Expo mentioned in code',
  'Android mentioned in code',
  'iOS mentioned in code',
] as const;
