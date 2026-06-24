/**
 * Validation Runtime Governance V1 — governance policy authority.
 */

import {
  VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN,
} from './validation-runtime-governance-v1-bounds.js';
import type { GovernancePolicy } from './validation-runtime-governance-v1-types.js';
import { TIER_DEFINITIONS } from './tier-registry.js';
import type { DuplicatePreventionRule } from './validation-runtime-governance-v1-types.js';

export function buildGovernancePolicy(
  duplicatePreventionRules: readonly DuplicatePreventionRule[],
): GovernancePolicy {
  return {
    version: 'V1',
    generatedAt: new Date().toISOString(),
    passToken: VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN,
    active: true,
    tiers: TIER_DEFINITIONS,
    rules: [
      {
        id: 'RULE_1',
        name: 'Validation Tiers',
        description: 'FAST / STANDARD / FULL / LAUNCH tier enforcement',
        enforced: true,
      },
      {
        id: 'RULE_2',
        name: 'Preview Server Reuse',
        description: 'Single shared preview runtime pool; new server requires justification',
        enforced: true,
      },
      {
        id: 'RULE_3',
        name: 'Build Output Cache',
        description: 'Build once, reuse dist/ via workspace fingerprint',
        enforced: true,
      },
      {
        id: 'RULE_4',
        name: 'Playwright Session Reuse',
        description: 'Shared browser session pool across validators',
        enforced: true,
      },
      {
        id: 'RULE_5',
        name: 'AFLA Tiering',
        description: 'AFLA only in FULL and LAUNCH tiers',
        enforced: true,
      },
      {
        id: 'RULE_6',
        name: 'Affected Capability Validation',
        description: 'Capability impact graph maps changed files to validators',
        enforced: true,
      },
      {
        id: 'RULE_7',
        name: 'Validation Artifact Reuse',
        description: 'Reuse execution/verification/build/blueprint/AFLA proofs when valid',
        enforced: true,
      },
      {
        id: 'RULE_8',
        name: 'Regression Budget',
        description: 'Runtime budget per validator; breaches become audit findings',
        enforced: true,
      },
      {
        id: 'RULE_9',
        name: 'Duplicate Validation Prevention',
        description: 'Block repeated expensive operations when reusable evidence exists',
        enforced: true,
      },
      {
        id: 'RULE_10',
        name: 'Governance Metrics',
        description: 'Track overhead, duplicate work, cache/reuse hit rates',
        enforced: true,
      },
    ],
    duplicatePreventionRules,
  };
}

let governanceActive = true;

export function isValidationRuntimeGovernanceActive(): boolean {
  return governanceActive;
}

export function setValidationRuntimeGovernanceActive(active: boolean): void {
  governanceActive = active;
}

export function resetValidationRuntimeGovernanceForTests(): void {
  governanceActive = true;
}
