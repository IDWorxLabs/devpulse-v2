/**
 * Fix rollback plan — rollback steps without performing rollback.
 */

import type { FixRollbackPlan } from './auto-fix-runtime-types.js';

let rollbackCounter = 0;

function nextRollbackId(): string {
  rollbackCounter += 1;
  return `frbk-${rollbackCounter.toString().padStart(4, '0')}`;
}

export function resetFixRollbackCounterForTests(): void {
  rollbackCounter = 0;
}

export function createFixRollbackPlan(query: string): FixRollbackPlan {
  const lower = query.toLowerCase();

  const steps = [
    'Capture current validation pass tokens and diagnostics state',
    'Revert any future applied change proposals to applied: false',
    'Reset runtime diagnostics counters to last known-good baseline',
    'Restore execution packet readiness.executionAllowed to false',
    'Re-run foundation validation scripts before re-attempting fix',
  ];

  if (lower.includes('rollback')) {
    steps.push('Document rollback evidence in operator feed before any future fix application');
  }

  return {
    rollbackId: nextRollbackId(),
    steps,
    prerequisites: [
      'Founder approval for rollback scope',
      'No active execution or deployment in progress',
      'Validation scripts available for affected phase',
      'Failure visibility records preserved for audit',
    ],
    simulationOnly: true,
  };
}
