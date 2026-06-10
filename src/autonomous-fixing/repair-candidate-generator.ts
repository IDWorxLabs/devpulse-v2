/**
 * Autonomous Fixing — repair candidate generation (planning only).
 */

import type { FailureCategory, FixPlanInput, RepairCandidate } from './autonomous-fixing-types.js';

const CATEGORY_REPAIRS: Record<FailureCategory, RepairCandidate[]> = {
  ROUTING: [
    { description: 'add missing registry entry', targetedSubsystems: ['routing', 'capability-registry'], estimatedImpact: 'MEDIUM', estimatedConfidence: 70 },
    { description: 'resolve alias collision', targetedSubsystems: ['find-panel', 'routing'], estimatedImpact: 'LOW', estimatedConfidence: 75 },
  ],
  TEST: [
    { description: 'investigate failing suite', targetedSubsystems: ['autonomous-testing'], estimatedImpact: 'MEDIUM', estimatedConfidence: 65 },
    { description: 'increase coverage', targetedSubsystems: ['autonomous-testing', 'verification'], estimatedImpact: 'MEDIUM', estimatedConfidence: 60 },
  ],
  VERIFICATION: [
    { description: 'rebuild verification plan', targetedSubsystems: ['verification-intelligence'], estimatedImpact: 'MEDIUM', estimatedConfidence: 68 },
    { description: 'regenerate verification snapshot', targetedSubsystems: ['verification-integration'], estimatedImpact: 'LOW', estimatedConfidence: 72 },
  ],
  TRUST: [
    { description: 'trigger trust recovery path', targetedSubsystems: ['trust-engine'], estimatedImpact: 'HIGH', estimatedConfidence: 55 },
  ],
  WORLD2: [
    { description: 'revalidate workspace boundary', targetedSubsystems: ['world2'], estimatedImpact: 'HIGH', estimatedConfidence: 58 },
  ],
  CLOUD: [
    { description: 'review cloud runtime contract', targetedSubsystems: ['cloud-runtime'], estimatedImpact: 'HIGH', estimatedConfidence: 60 },
  ],
  BUILD: [
    { description: 'reconcile build strategy metadata', targetedSubsystems: ['build-strategy-engine'], estimatedImpact: 'MEDIUM', estimatedConfidence: 65 },
  ],
  BRAIN: [
    { description: 'audit capability selection path', targetedSubsystems: ['command-center-brain'], estimatedImpact: 'HIGH', estimatedConfidence: 62 },
  ],
  TYPECHECK: [
    { description: 'inspect type boundary exports', targetedSubsystems: ['foundation'], estimatedImpact: 'LOW', estimatedConfidence: 70 },
  ],
  RUNTIME: [
    { description: 'review startup safety contracts', targetedSubsystems: ['runtime'], estimatedImpact: 'MEDIUM', estimatedConfidence: 63 },
  ],
  UNKNOWN: [
    { description: 'gather additional failure context', targetedSubsystems: ['operator-feed'], estimatedImpact: 'LOW', estimatedConfidence: 40 },
  ],
};

export function generateRepairCandidates(
  category: FailureCategory,
  _input: FixPlanInput,
): RepairCandidate[] {
  return [...(CATEGORY_REPAIRS[category] ?? CATEGORY_REPAIRS.UNKNOWN)];
}
