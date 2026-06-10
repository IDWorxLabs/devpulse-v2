/**
 * Autonomous Fixing — strategy registry metadata.
 */

import type { FixStrategy } from './autonomous-fixing-types.js';

export interface FixStrategyEntry {
  strategy: FixStrategy;
  description: string;
  minimumConfidence: number;
  riskTolerance: number;
  escalationThreshold: number;
}

export const FIX_STRATEGY_REGISTRY: readonly FixStrategyEntry[] = [
  { strategy: 'RETRY', description: 'Retry transient low-risk failures', minimumConfidence: 40, riskTolerance: 60, escalationThreshold: 3 },
  { strategy: 'REPAIR', description: 'Localized repair when root cause is probable', minimumConfidence: 60, riskTolerance: 45, escalationThreshold: 2 },
  { strategy: 'REGENERATE', description: 'Regenerate corrupted or inconsistent artifacts', minimumConfidence: 55, riskTolerance: 40, escalationThreshold: 2 },
  { strategy: 'ROLLBACK', description: 'Rollback when regression or instability is severe', minimumConfidence: 70, riskTolerance: 15, escalationThreshold: 1 },
  { strategy: 'TRUST_RECOVERY', description: 'Trust recovery when confidence collapses', minimumConfidence: 75, riskTolerance: 10, escalationThreshold: 1 },
  { strategy: 'ESCALATE', description: 'Escalate repeated or critical failures', minimumConfidence: 50, riskTolerance: 20, escalationThreshold: 1 },
  { strategy: 'FOUNDER_REVIEW', description: 'Founder review for policy or governance conflicts', minimumConfidence: 80, riskTolerance: 5, escalationThreshold: 0 },
] as const;

export function getFixStrategyEntry(strategy: FixStrategy): FixStrategyEntry | undefined {
  return FIX_STRATEGY_REGISTRY.find((e) => e.strategy === strategy);
}

export function listFixStrategyEntries(): FixStrategyEntry[] {
  return [...FIX_STRATEGY_REGISTRY];
}
