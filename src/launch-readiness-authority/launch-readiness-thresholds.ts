/**
 * Launch Readiness Authority — transparent deterministic thresholds and weighting.
 */

export const LAUNCH_READINESS_AUTHORITY_PASS_TOKEN = 'LAUNCH_READINESS_AUTHORITY_PASS';
export const LAUNCH_READINESS_OWNER_MODULE = 'aidevengine_launch_readiness_authority';
export const MAX_LAUNCH_READINESS_HISTORY = 12;
export const LAUNCH_READINESS_CACHE_KEY_PREFIX = 'launch-readiness-authority-v1';
export const LAUNCH_READINESS_REPORT_TITLE = 'LAUNCH_READINESS_AUTHORITY_REPORT';

export const CONFIDENCE_PUBLIC_LAUNCH = 90;
export const CONFIDENCE_PUBLIC_BETA = 80;
export const CONFIDENCE_PRIVATE_BETA = 70;
export const CONFIDENCE_INTERNAL_USE = 60;

export const MAX_BLOCKERS = 24;
export const MAX_STRENGTHS = 24;
export const MAX_RECOMMENDATIONS = 16;
export const MAX_EVIDENCE_BREAKDOWN = 20;

/** Transparent authority weighting — must sum to 1.0 */
export const AUTHORITY_WEIGHTS: Readonly<Record<string, number>> = {
  'founder-testing': 0.08,
  'trust-authority': 0.12,
  'user-success-authority': 0.12,
  'customer-value-authority': 0.1,
  'first-time-user-reality-authority': 0.1,
  'chat-intelligence-reality': 0.06,
  'promise-fulfillment-authority': 0.08,
  'competitive-reality-authority': 0.02,
  'self-awareness-authority': 0.05,
  'gap-detection-authority': 0.04,
  'unknown-discovery-authority': 0.04,
  'self-evolution-authority': 0.01,
  'repository-typecheck-reality': 0.02,
  'skeptical-founder-simulator': 0.01,
  'universal-app-blueprint-visual': 0.03,
  'feature-reality-validation': 0.03,
  'universal-feature-contract-intelligence': 0.03,
  'engineering-reality-authority': 0.03,
  'autonomous-founder-launch-authority': 0.03,
} as const;

export const WEIGHTED_AUTHORITY_IDS = Object.keys(AUTHORITY_WEIGHTS);

export function assertAuthorityWeightIntegrity(): boolean {
  const total = WEIGHTED_AUTHORITY_IDS.reduce((sum, id) => sum + (AUTHORITY_WEIGHTS[id] ?? 0), 0);
  return Math.abs(total - 1) < 0.0001 && WEIGHTED_AUTHORITY_IDS.length === 19;
}
