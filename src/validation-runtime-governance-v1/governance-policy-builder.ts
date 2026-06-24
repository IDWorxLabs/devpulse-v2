/**
 * Validation Runtime Governance V1 — governance policy (10 rules).
 */

import { TIER_TARGET_RUNTIME_SECONDS } from './validation-runtime-governance-bounds.js';
import type { GovernancePolicy, GovernanceRule } from './validation-runtime-governance-types.js';

const GOVERNANCE_RULES: readonly GovernanceRule[] = [
  {
    ruleId: 1,
    name: 'Validation Tiers',
    summary: 'FAST, STANDARD, FULL, LAUNCH tiers bound validation scope by phase.',
    enforcement: 'ACTIVE',
  },
  {
    ruleId: 2,
    name: 'Preview Server Reuse',
    summary: 'Single shared preview server across validators; attach to existing runtime when available.',
    enforcement: 'ACTIVE',
  },
  {
    ruleId: 3,
    name: 'Build Output Cache',
    summary: 'Build once, reuse dist/ via build hash and workspace fingerprint.',
    enforcement: 'ACTIVE',
  },
  {
    ruleId: 4,
    name: 'Playwright Session Reuse',
    summary: 'Shared browser session pool reuses browser, context, and safe runtime state.',
    enforcement: 'ACTIVE',
  },
  {
    ruleId: 5,
    name: 'AFLA Tiering',
    summary: 'AFLA executes only in FULL and LAUNCH tiers unless explicitly requested.',
    enforcement: 'ACTIVE',
  },
  {
    ruleId: 6,
    name: 'Affected Capability Validation',
    summary: 'Capability Impact Graph maps changed files to capabilities and targeted validators.',
    enforcement: 'ACTIVE',
  },
  {
    ruleId: 7,
    name: 'Validation Artifact Reuse',
    summary: 'Reuse execution, verification, build, blueprint, and AFLA proofs when still valid.',
    enforcement: 'ACTIVE',
  },
  {
    ruleId: 8,
    name: 'Regression Budget',
    summary: 'Every validator receives LOW/MEDIUM/HIGH/CRITICAL runtime budget; breaches are audit findings.',
    enforcement: 'ACTIVE',
  },
  {
    ruleId: 9,
    name: 'Duplicate Validation Prevention',
    summary: 'Block repeated npm install/build, preview startup, UVL, AFLA, and Playwright when reusable evidence exists.',
    enforcement: 'ACTIVE',
  },
  {
    ruleId: 10,
    name: 'Governance Metrics',
    summary: 'Track validation runtime, overhead, duplicate work %, cache hit %, preview reuse %, build reuse %.',
    enforcement: 'ACTIVE',
  },
];

export function buildGovernancePolicy(): GovernancePolicy {
  return {
    version: 'V1',
    generatedAt: new Date().toISOString(),
    active: true,
    principle: 'Bounded, Cached, Reusable, Tiered, Targeted — without reducing correctness.',
    rules: GOVERNANCE_RULES,
    tierTargets: {
      FAST: {
        targetRuntimeSeconds: TIER_TARGET_RUNTIME_SECONDS.FAST,
        description: 'Implementation phase — targeted validators only, < 60s.',
      },
      STANDARD: {
        targetRuntimeSeconds: TIER_TARGET_RUNTIME_SECONDS.STANDARD,
        description: 'Feature completion — affected capability and integration validators, < 5 min.',
      },
      FULL: {
        targetRuntimeSeconds: TIER_TARGET_RUNTIME_SECONDS.FULL,
        description: 'Milestone completion — cross-capability and major integration validation, < 15 min.',
      },
      LAUNCH: {
        targetRuntimeSeconds: TIER_TARGET_RUNTIME_SECONDS.LAUNCH,
        description: 'Launch candidate — UVL, PAI, AFLA, production readiness; maximum confidence.',
      },
    },
  };
}
