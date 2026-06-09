/**
 * Build Strategy Engine — Autonomous Builder bridge (primary upstream).
 */

import { getAutonomousBuildRecord, listAutonomousBuilds } from '../autonomous-builder/index.js';
import {
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategySession, BuildStrategyAutonomousBuilderLink } from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

export function linkBuildStrategyToAutonomousBuilder(
  buildStrategyId: string,
  autonomousBuildId: string,
): BuildStrategyAutonomousBuilderLink | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  const build = getAutonomousBuildRecord(autonomousBuildId);
  if (!record || !build) return null;

  const mismatch =
    build.buildOwnership.projectId !== record.strategyOwnership.projectId ||
    record.strategyOwnership.autonomousBuildId !== autonomousBuildId;

  const link: BuildStrategyAutonomousBuilderLink = {
    autonomousBuildId,
    linkedAt: Date.now(),
    linkAuthority: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeBuildStrategyRecord({
    ...record,
    autonomousBuildId,
    strategyOwnership: { ...record.strategyOwnership, autonomousBuildId },
    strategyContext: { ...record.strategyContext, autonomousBuildId },
    strategyAutonomousBuilderLink: link,
    updatedAt: Date.now(),
  });

  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'AUTONOMOUS_BUILDER',
    summary: `Linked to autonomous build ${autonomousBuildId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: autonomousBuildId,
  });

  return link;
}

export function getAutonomousBuilderForBuildStrategy(buildStrategyId: string): string | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyAutonomousBuilderLink.autonomousBuildId ?? null;
}

export function listBuildStrategiesByAutonomousBuilder(autonomousBuildId: string): BuildStrategySession[] {
  return listStoredBuildStrategyRecords().filter(
    (r) => r.strategyAutonomousBuilderLink.autonomousBuildId === autonomousBuildId,
  );
}

export function detectBuildStrategyAutonomousBuilderMismatch(buildStrategyId: string): boolean {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return true;
  const build = getAutonomousBuildRecord(record.strategyAutonomousBuilderLink.autonomousBuildId);
  if (!build) return true;
  return (
    build.buildOwnership.projectId !== record.strategyOwnership.projectId ||
    record.strategyAutonomousBuilderLink.mismatchDetected
  );
}

export function resolveAutonomousBuilderForBuildStrategyRegistration(
  autonomousBuildId: string,
): { exists: boolean; projectId: string | null; pushId: string | null; deliveryId: string | null; notificationId: string | null; inboxEntryId: string | null } {
  const build = getAutonomousBuildRecord(autonomousBuildId);
  if (!build) return { exists: false, projectId: null, pushId: null, deliveryId: null, notificationId: null, inboxEntryId: null };
  return {
    exists: true,
    projectId: build.buildOwnership.projectId,
    pushId: build.pushId,
    deliveryId: build.deliveryId,
    notificationId: build.notificationId,
    inboxEntryId: build.inboxEntryId,
  };
}

export function findAutonomousBuildByName(buildName: string): string | null {
  const match = listAutonomousBuilds().find((b) => b.buildMetadata.buildName === buildName);
  return match?.autonomousBuildId ?? null;
}
