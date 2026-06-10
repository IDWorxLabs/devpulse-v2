/**
 * Autonomous Completion Engine — decision registry metadata.
 */

import type { CompletionDecision } from './autonomous-completion-engine-types.js';

export interface CompletionDecisionEntry {
  decision: CompletionDecision;
  description: string;
  confidenceRequirement: number;
  trustRequirement: number;
  riskTolerance: number;
}

export const COMPLETION_DECISION_REGISTRY: readonly CompletionDecisionEntry[] = [
  { decision: 'COMPLETE', description: 'Task genuinely complete with sufficient evidence', confidenceRequirement: 75, trustRequirement: 70, riskTolerance: 30 },
  { decision: 'CONTINUE_TESTING', description: 'Testing evidence or coverage insufficient', confidenceRequirement: 50, trustRequirement: 45, riskTolerance: 50 },
  { decision: 'CONTINUE_FIXING', description: 'Unresolved failures require further fixing', confidenceRequirement: 45, trustRequirement: 40, riskTolerance: 55 },
  { decision: 'CONTINUE_VERIFICATION', description: 'Verification evidence not yet sufficient', confidenceRequirement: 55, trustRequirement: 50, riskTolerance: 45 },
  { decision: 'TRUST_RECOVERY_REQUIRED', description: 'Trust degraded or recovery active', confidenceRequirement: 60, trustRequirement: 70, riskTolerance: 20 },
  { decision: 'ESCALATE', description: 'Repeated cycles or excessive uncertainty', confidenceRequirement: 40, trustRequirement: 35, riskTolerance: 25 },
  { decision: 'FOUNDER_REVIEW', description: 'Governance boundary or insufficient certainty', confidenceRequirement: 70, trustRequirement: 65, riskTolerance: 15 },
  { decision: 'BLOCKED', description: 'Impossible completion state or missing dependencies', confidenceRequirement: 0, trustRequirement: 0, riskTolerance: 0 },
] as const;

export function getCompletionDecisionEntry(decision: CompletionDecision): CompletionDecisionEntry | undefined {
  return COMPLETION_DECISION_REGISTRY.find((e) => e.decision === decision);
}

export function listCompletionDecisionEntries(): CompletionDecisionEntry[] {
  return [...COMPLETION_DECISION_REGISTRY];
}
