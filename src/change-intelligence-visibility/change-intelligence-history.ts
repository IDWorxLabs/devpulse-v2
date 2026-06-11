/**
 * Bounded change intelligence snapshot history.
 */

import type { ProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';
import type { ChangeIntelligenceSnapshot } from './change-intelligence-visibility-types.js';
import { getCachedVerificationResults } from '../verification-results-visibility/verification-results-cache.js';

const MAX_SNAPSHOTS = 12;
const history: ChangeIntelligenceSnapshot[] = [];

export function resetChangeIntelligenceHistoryForTests(): void {
  history.length = 0;
}

export function getChangeIntelligenceHistory(): readonly ChangeIntelligenceSnapshot[] {
  return history;
}

export function captureChangeIntelligenceSnapshotFromWorkspace(
  workspace: ProductWorkspaceSnapshot,
  label: string,
): ChangeIntelligenceSnapshot {
  const vr = workspace.verificationResults;
  const summary = vr?.summary;
  return {
    capturedAt: workspace.generatedAt,
    label,
    previewState: workspace.livePreview.reality?.state ?? 'NO_PREVIEW',
    runningAppState: workspace.runningApplication?.outputState ?? 'NO_RUNNING_APP',
    verificationState: vr?.state ?? 'NO_VERIFICATION_RUN',
    readinessScore: summary?.readinessScore ?? 0,
    passCount: summary?.passCount ?? 0,
    failCount: summary?.failCount ?? 0,
    blockedCount: summary?.blockedCount ?? 0,
    warningCount: summary?.warningCount ?? 0,
    betaReady: vr?.betaReady ?? false,
    launchReady: vr?.launchReady ?? false,
    projectFactCount: workspace.projectMemory.vaultState.factCount,
    projectCount: workspace.projectMemory.vaultState.projectCount,
    launchReadinessScore: 0,
    topRiskCount: workspace.runningApplication?.warnings?.length ?? 0,
  };
}

function snapshotsEqual(a: ChangeIntelligenceSnapshot, b: ChangeIntelligenceSnapshot): boolean {
  return (
    a.previewState === b.previewState &&
    a.runningAppState === b.runningAppState &&
    a.verificationState === b.verificationState &&
    a.readinessScore === b.readinessScore &&
    a.passCount === b.passCount &&
    a.failCount === b.failCount &&
    a.warningCount === b.warningCount &&
    a.betaReady === b.betaReady &&
    a.launchReady === b.launchReady &&
    a.projectFactCount === b.projectFactCount
  );
}

export function recordChangeIntelligenceSnapshot(snapshot: ChangeIntelligenceSnapshot): boolean {
  const last = history[history.length - 1];
  if (last && snapshotsEqual(last, snapshot)) {
    return false;
  }
  history.push(snapshot);
  while (history.length > MAX_SNAPSHOTS) {
    history.shift();
  }
  return true;
}

export function recordWorkspaceChangeSnapshot(workspace: ProductWorkspaceSnapshot, label: string): ChangeIntelligenceSnapshot {
  const cached = getCachedVerificationResults();
  const snap = captureChangeIntelligenceSnapshotFromWorkspace(
    cached
      ? {
          ...workspace,
          verificationResults: cached,
        }
      : workspace,
    label,
  );
  recordChangeIntelligenceSnapshot(snap);
  return snap;
}

export function recordFounderTestChangeSnapshot(
  workspace: ProductWorkspaceSnapshot,
  readinessScore: number,
  launchReadinessScore: number,
): ChangeIntelligenceSnapshot {
  const cached = getCachedVerificationResults();
  const snap: ChangeIntelligenceSnapshot = {
    ...captureChangeIntelligenceSnapshotFromWorkspace(workspace, 'Founder Test completed'),
    label: 'Founder Test completed',
    readinessScore: cached?.summary.readinessScore ?? readinessScore,
    launchReadinessScore,
    verificationState: cached?.state ?? 'VERIFICATION_PARTIAL',
  };
  recordChangeIntelligenceSnapshot(snap);
  return snap;
}
