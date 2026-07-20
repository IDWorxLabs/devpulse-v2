/**
 * Universal Capability Pack Framework V1 — pack lifecycle stages.
 */

import type { PackLifecycleStage } from './universal-capability-pack-types.js';

const ORDER: readonly PackLifecycleStage[] = [
  'DISCOVERED',
  'VALIDATED',
  'RESOLVED',
  'CONFIGURED',
  'COMPOSED',
  'MATERIALIZED',
  'REGISTERED',
  'INITIALIZED',
  'VERIFIED',
  'PRODUCTION_READY',
];

export function canAdvanceLifecycle(from: PackLifecycleStage, to: PackLifecycleStage): boolean {
  if (to === 'BLOCKED' || to === 'FAILED') return true;
  const fromIdx = ORDER.indexOf(from);
  const toIdx = ORDER.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx === fromIdx + 1;
}

export function enforceLifecycleOrder(stages: readonly PackLifecycleStage[]): boolean {
  for (let i = 1; i < stages.length; i++) {
    if (!canAdvanceLifecycle(stages[i - 1]!, stages[i]!)) return false;
  }
  return true;
}

export function lifecycleStageIndex(stage: PackLifecycleStage): number {
  return ORDER.indexOf(stage);
}
