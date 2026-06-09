/**
 * Autonomous Builder Foundation — build session manager (planning only).
 */

import {
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildRecords,
  storeAutonomousBuildRecord,
} from './autonomous-builder-store.js';
import { registerAutonomousBuildOwnership } from './autonomous-builder-ownership.js';
import { createAutonomousGoal } from './autonomous-builder-goal.js';
import { createAutonomousPlan } from './autonomous-builder-plan.js';
import { createAutonomousStagesForPlan } from './autonomous-builder-stage.js';
import { evaluateReadiness } from './autonomous-builder-readiness.js';
import { registerConstraint } from './autonomous-builder-constraint.js';
import { registerCapability } from './autonomous-builder-capability.js';
import { recordAutonomousBuildLifecycleEvent } from './autonomous-builder-lifecycle.js';
import type { AutonomousBuildSession, AutonomousBuildOwnership } from './autonomous-builder-types.js';

export function createAutonomousBuild(record: AutonomousBuildSession): AutonomousBuildSession {
  storeAutonomousBuildRecord(record);
  registerAutonomousBuildOwnership(record.autonomousBuildId, record.buildOwnership);
  recordAutonomousBuildLifecycleEvent(
    record.autonomousBuildId,
    'BUILD_CREATED',
    `Created ${record.buildMetadata.buildName}`,
  );
  return record;
}

export function getAutonomousBuild(autonomousBuildId: string): AutonomousBuildSession | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId);
}

export function listAutonomousBuilds(): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords();
}

export function pauseAutonomousBuild(autonomousBuildId: string): AutonomousBuildSession | null {
  recordAutonomousBuildLifecycleEvent(autonomousBuildId, 'BUILD_PAUSED', 'Build paused — metadata only');
  return getStoredAutonomousBuildRecord(autonomousBuildId);
}

export function blockAutonomousBuild(autonomousBuildId: string, reason = 'Build blocked'): AutonomousBuildSession | null {
  recordAutonomousBuildLifecycleEvent(autonomousBuildId, 'BUILD_BLOCKED', reason);
  return getStoredAutonomousBuildRecord(autonomousBuildId);
}

export function completeAutonomousBuild(autonomousBuildId: string): AutonomousBuildSession | null {
  recordAutonomousBuildLifecycleEvent(
    autonomousBuildId,
    'BUILD_COMPLETED',
    'Planning marked complete — no code execution',
  );
  return getStoredAutonomousBuildRecord(autonomousBuildId);
}

export function archiveAutonomousBuild(autonomousBuildId: string): AutonomousBuildSession | null {
  recordAutonomousBuildLifecycleEvent(autonomousBuildId, 'BUILD_ARCHIVED');
  return getStoredAutonomousBuildRecord(autonomousBuildId);
}

export function trackAutonomousMetadata(
  autonomousBuildId: string,
  metadata: Partial<AutonomousBuildSession['buildMetadata']>,
): AutonomousBuildSession | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return null;

  const updated: AutonomousBuildSession = {
    ...record,
    buildMetadata: { ...record.buildMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeAutonomousBuildRecord(updated);
  return updated;
}

export function trackAutonomousOwnership(
  autonomousBuildId: string,
  ownership: Partial<AutonomousBuildOwnership>,
): AutonomousBuildSession | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return null;

  const updatedOwnership = { ...record.buildOwnership, ...ownership };
  registerAutonomousBuildOwnership(autonomousBuildId, updatedOwnership);

  const updated: AutonomousBuildSession = {
    ...record,
    buildOwnership: updatedOwnership,
    updatedAt: Date.now(),
  };
  storeAutonomousBuildRecord(updated);
  return updated;
}

export function runAutonomousBuildPlanningPipeline(autonomousBuildId: string): AutonomousBuildSession | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return null;

  createAutonomousGoal({ autonomousBuildId });
  createAutonomousPlan({ autonomousBuildId });
  createAutonomousStagesForPlan(autonomousBuildId);
  evaluateReadiness(autonomousBuildId);
  registerConstraint({ autonomousBuildId });
  registerCapability({ autonomousBuildId });
  completeAutonomousBuild(autonomousBuildId);
  return getStoredAutonomousBuildRecord(autonomousBuildId);
}

export { createAutonomousGoal } from './autonomous-builder-goal.js';
export { createAutonomousPlan } from './autonomous-builder-plan.js';
export { createAutonomousStage, createAutonomousStagesForPlan } from './autonomous-builder-stage.js';
export { evaluateReadiness } from './autonomous-builder-readiness.js';
export { registerConstraint } from './autonomous-builder-constraint.js';
export { registerCapability } from './autonomous-builder-capability.js';
