/**
 * Launch Council Registry — bounded, deterministic authority registration.
 */

import type { LaunchCouncilRegistryEntry } from './launch-council-types.js';

const REGISTERED_AUTHORITIES: readonly LaunchCouncilRegistryEntry[] = [
  {
    authorityId: 'founder-testing',
    authorityName: 'Founder Testing',
    authorityCategory: 'FOUNDER_TESTING',
    registrationOrder: 1,
  },
  {
    authorityId: 'chat-intelligence-reality',
    authorityName: 'Chat Intelligence Reality',
    authorityCategory: 'CHAT_INTELLIGENCE',
    registrationOrder: 2,
  },
  {
    authorityId: 'repository-typecheck-reality',
    authorityName: 'Repository Typecheck Reality',
    authorityCategory: 'REPOSITORY_INTEGRITY',
    registrationOrder: 3,
  },
  {
    authorityId: 'skeptical-founder-simulator',
    authorityName: 'Skeptical Founder Simulator',
    authorityCategory: 'SKEPTICAL_FOUNDER',
    registrationOrder: 4,
  },
  {
    authorityId: 'promise-fulfillment-authority',
    authorityName: 'Promise Fulfillment Authority',
    authorityCategory: 'PROMISE_FULFILLMENT',
    registrationOrder: 5,
  },
  {
    authorityId: 'trust-authority',
    authorityName: 'Trust Authority',
    authorityCategory: 'TRUST_AUTHORITY',
    registrationOrder: 6,
  },
  {
    authorityId: 'self-awareness-authority',
    authorityName: 'Self-Awareness Authority',
    authorityCategory: 'SELF_AWARENESS',
    registrationOrder: 7,
  },
  {
    authorityId: 'user-success-authority',
    authorityName: 'User Success Authority',
    authorityCategory: 'USER_SUCCESS',
    registrationOrder: 8,
  },
  {
    authorityId: 'gap-detection-authority',
    authorityName: 'Gap Detection Authority',
    authorityCategory: 'GAP_DETECTION',
    registrationOrder: 9,
  },
  {
    authorityId: 'self-evolution-authority',
    authorityName: 'Self-Evolution Authority',
    authorityCategory: 'SELF_EVOLUTION',
    registrationOrder: 10,
  },
  {
    authorityId: 'unknown-discovery-authority',
    authorityName: 'Unknown Discovery Authority',
    authorityCategory: 'UNKNOWN_DISCOVERY',
    registrationOrder: 11,
  },
  {
    authorityId: 'first-time-user-reality-authority',
    authorityName: 'First-Time User Reality Authority',
    authorityCategory: 'FIRST_TIME_USER_REALITY',
    registrationOrder: 12,
  },
  {
    authorityId: 'customer-value-authority',
    authorityName: 'Customer Value Authority',
    authorityCategory: 'CUSTOMER_VALUE',
    registrationOrder: 13,
  },
  {
    authorityId: 'competitive-reality-authority',
    authorityName: 'Competitive Reality Authority',
    authorityCategory: 'COMPETITIVE_REALITY',
    registrationOrder: 14,
  },
  {
    authorityId: 'reality-proof-authority',
    authorityName: 'Reality-Proof Authority',
    authorityCategory: 'REALITY_PROOF',
    registrationOrder: 15,
  },
  {
    authorityId: 'real-user-reality-authority',
    authorityName: 'Real User Reality Authority',
    authorityCategory: 'REAL_USER_REALITY',
    registrationOrder: 16,
  },
  {
    authorityId: 'adoption-prediction-authority',
    authorityName: 'Adoption Prediction Authority',
    authorityCategory: 'ADOPTION_PREDICTION',
    registrationOrder: 17,
  },
  {
    authorityId: 'launch-readiness-authority',
    authorityName: 'Launch Readiness Authority',
    authorityCategory: 'LAUNCH_READINESS',
    registrationOrder: 18,
  },
  {
    authorityId: 'launch-council-finalization',
    authorityName: 'Launch Council Finalization',
    authorityCategory: 'LAUNCH_COUNCIL_FINALIZATION',
    registrationOrder: 19,
  },
  {
    authorityId: 'launch-verdict-governance',
    authorityName: 'Launch Verdict Governance',
    authorityCategory: 'LAUNCH_VERDICT_GOVERNANCE',
    registrationOrder: 20,
  },
  {
    authorityId: 'ui-reviewer-authority',
    authorityName: 'UI Reviewer Authority',
    authorityCategory: 'UI_REVIEWER',
    registrationOrder: 21,
  },
  {
    authorityId: 'clarifying-question-intelligence',
    authorityName: 'Clarifying Question Intelligence',
    authorityCategory: 'CLARIFYING_QUESTION_INTELLIGENCE',
    registrationOrder: 22,
  },
  {
    authorityId: 'adaptive-autofix-intelligence',
    authorityName: 'Adaptive AutoFix Intelligence',
    authorityCategory: 'ADAPTIVE_AUTOFIX_INTELLIGENCE',
    registrationOrder: 23,
  },
  {
    authorityId: 'universal-app-blueprint-visual',
    authorityName: 'Universal App Blueprint Visual Validation',
    authorityCategory: 'PRODUCT_EXPERIENCE',
    registrationOrder: 24,
  },
  {
    authorityId: 'feature-reality-validation',
    authorityName: 'Feature Reality Validation',
    authorityCategory: 'PRODUCT_EXPERIENCE',
    registrationOrder: 25,
  },
  {
    authorityId: 'universal-feature-contract-intelligence',
    authorityName: 'Universal Feature Contract Intelligence',
    authorityCategory: 'PRODUCT_EXPERIENCE',
    registrationOrder: 26,
  },
  {
    authorityId: 'engineering-reality-authority',
    authorityName: 'Engineering Reality Authority',
    authorityCategory: 'ENGINEERING_REALITY',
    registrationOrder: 27,
  },
  {
    authorityId: 'autonomous-founder-launch-authority',
    authorityName: 'Autonomous Founder Launch Authority',
    authorityCategory: 'FOUNDER_LAUNCH_AUTHORITY',
    registrationOrder: 28,
  },
] as const;

export function listLaunchCouncilAuthorities(): readonly LaunchCouncilRegistryEntry[] {
  return REGISTERED_AUTHORITIES;
}

export function getLaunchCouncilAuthority(authorityId: string): LaunchCouncilRegistryEntry | null {
  return REGISTERED_AUTHORITIES.find((entry) => entry.authorityId === authorityId) ?? null;
}

export function validateLaunchCouncilAuthorityIds(authorityIds: readonly string[]): {
  valid: boolean;
  unknownIds: string[];
  missingRegisteredIds: string[];
} {
  const registeredIds = REGISTERED_AUTHORITIES.map((entry) => entry.authorityId);
  const unknownIds = authorityIds.filter((id) => !registeredIds.includes(id));
  const missingRegisteredIds = registeredIds.filter((id) => !authorityIds.includes(id));
  return {
    valid: unknownIds.length === 0,
    unknownIds,
    missingRegisteredIds,
  };
}

export function assertLaunchCouncilRegistryIntegrity(): boolean {
  const orders = REGISTERED_AUTHORITIES.map((entry) => entry.registrationOrder);
  const uniqueOrders = new Set(orders);
  return (
    REGISTERED_AUTHORITIES.length === 26 &&
    uniqueOrders.size === REGISTERED_AUTHORITIES.length &&
    REGISTERED_AUTHORITIES.every((entry) => entry.authorityId.length > 0)
  );
}
