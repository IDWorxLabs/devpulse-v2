/**
 * Autonomous Builder Foundation — constraint metadata (planning only).
 */

import {
  nextAutonomousBuildConstraintId,
  getStoredAutonomousBuildRecord,
  storeAutonomousBuildRecord,
  storeAutonomousBuildConstraint,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildConstraint } from './autonomous-builder-types.js';

export function registerConstraint(input: {
  autonomousBuildId: string;
  constraintName?: string;
  constraintReason?: string;
}): AutonomousBuildConstraint | null {
  const record = getStoredAutonomousBuildRecord(input.autonomousBuildId);
  if (!record) return null;

  const constraint: AutonomousBuildConstraint = {
    constraintId: nextAutonomousBuildConstraintId(),
    autonomousBuildId: input.autonomousBuildId,
    constraintName: input.constraintName ?? 'planning_only',
    constraintReason: input.constraintReason ?? 'No code execution — metadata planning only',
    registeredAt: Date.now(),
    planningOnly: true,
  };

  storeAutonomousBuildConstraint(constraint);
  const updated = [...record.buildConstraints, constraint];
  storeAutonomousBuildRecord({ ...record, buildConstraints: updated, updatedAt: Date.now() });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId: input.autonomousBuildId,
    category: 'CONSTRAINT',
    summary: `Constraint ${constraint.constraintId}: ${constraint.constraintName}`,
    scopeUsed: constraint.constraintId,
  });

  return constraint;
}

export function getAutonomousBuildConstraints(autonomousBuildId: string): AutonomousBuildConstraint[] {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildConstraints ?? [];
}
