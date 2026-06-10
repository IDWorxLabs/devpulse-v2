/**
 * Multi Project Monitoring — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listMultiProjectFoundationUvlRows,
  listWorkspaceIsolationExpansionUvlRows,
  listResourceAllocationUvlRows,
  listParallelBuildOrchestrationUvlRows,
  listMultiProjectVerificationUvlRows,
  listMultiProjectVerificationOrchestrationUvlRows,
  listMultiProjectMonitoringUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2MultiProjectFoundation } from '../multi-project-foundation/index.js';
import { getDevPulseV2WorkspaceIsolationExpansion } from '../workspace-isolation-expansion/index.js';
import { getDevPulseV2ResourceAllocation } from '../resource-allocation/index.js';
import { getDevPulseV2ParallelBuildOrchestration } from '../parallel-build-orchestration/index.js';
import { getDevPulseV2MultiProjectVerification } from '../multi-project-verification/index.js';
import { getDevPulseV2MultiProjectVerificationOrchestration } from '../multi-project-verification-orchestration/index.js';
import { getDevPulseV2OperatorFeed } from '../operator-feed/index.js';
import { getDevPulseV2LivePreviewRuntime } from '../live-preview-runtime/index.js';
import { coordinateProject } from '../multi-project-foundation/project-coordinator.js';
import { coordinateWorkspace } from '../workspace-isolation-expansion/workspace-coordinator.js';
import type { MonitoringRuntimeReport, ProjectMonitor, ProjectMonitorStatus } from './monitoring-types.js';
import {
  MULTI_PROJECT_MONITORING_OWNER_MODULE,
  MULTI_PROJECT_MONITORING_PASS_TOKEN,
} from './monitoring-types.js';
import { registerProjectMonitor } from './project-monitor-registry.js';
import { createProjectOperatorFeed, appendProjectOperatorEvent } from './project-operator-feed-manager.js';
import { createProjectEventStream, appendProjectEvent } from './project-event-stream-manager.js';
import { createProjectTimeline, appendTimelineEvent } from './project-timeline-manager.js';
import { updateProjectProgress } from './project-progress-tracker.js';
import { createProjectLivePreview } from './project-live-preview-manager.js';
import { createPreviewSession } from './project-preview-session-manager.js';
import { createMonitoringAlert } from './monitoring-alert-manager.js';
import { generateMonitoringReport } from './monitoring-reporting.js';
import { recordMonitoringHistory } from './monitoring-history.js';
import { getProjectMonitorCount } from './project-monitor-registry.js';
import { getProjectOperatorFeedCount } from './project-operator-feed-manager.js';
import { getProjectTimelineCount } from './project-timeline-manager.js';
import { getProjectLivePreviewCount } from './project-live-preview-manager.js';
import { getMonitoringAlertCount } from './monitoring-alert-manager.js';
import { getMonitoringCacheStats } from './monitoring-cache.js';

export interface MultiProjectMonitoringSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  multiProjectFoundationToken: string;
  workspaceIsolationToken: string;
  resourceAllocationToken: string;
  parallelBuildOrchestrationToken: string;
  multiProjectVerificationToken: string;
  verificationOrchestrationToken: string;
  operatorFeedToken: string;
  livePreviewToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: MultiProjectMonitoringSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let trackedProjectCount = 0;

export function getDevPulseV2MultiProjectMonitoring(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  monitoringOnly: true;
} {
  return {
    ownerModule: MULTI_PROJECT_MONITORING_OWNER_MODULE,
    passToken: MULTI_PROJECT_MONITORING_PASS_TOKEN,
    phase: 20.6,
    monitoringOnly: true,
  };
}

export function registerMultiProjectMonitoringWithCentralBrain(): MultiProjectMonitoringSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();
  const vaultState = getDevPulseV2ProjectVaultAuthority().getVaultState();
  const trustResult = getDevPulseV2TrustEngineAuthority().getLastResult();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    projectVaultProjects: vaultState.projectCount,
    trustScore: trustResult?.trustScore ?? null,
    world2SystemCount: summaries.filter((s) => s.systemId.includes('world2')).length,
    multiProjectFoundationToken: getDevPulseV2MultiProjectFoundation().passToken,
    workspaceIsolationToken: getDevPulseV2WorkspaceIsolationExpansion().passToken,
    resourceAllocationToken: getDevPulseV2ResourceAllocation().passToken,
    parallelBuildOrchestrationToken: getDevPulseV2ParallelBuildOrchestration().passToken,
    multiProjectVerificationToken: getDevPulseV2MultiProjectVerification().passToken,
    verificationOrchestrationToken: getDevPulseV2MultiProjectVerificationOrchestration().passToken,
    operatorFeedToken: getDevPulseV2OperatorFeed().passToken,
    livePreviewToken: getDevPulseV2LivePreviewRuntime().passToken,
    uvlRows:
      listMultiProjectFoundationUvlRows().length +
      listWorkspaceIsolationExpansionUvlRows().length +
      listResourceAllocationUvlRows().length +
      listParallelBuildOrchestrationUvlRows().length +
      listMultiProjectVerificationUvlRows().length +
      listMultiProjectVerificationOrchestrationUvlRows().length +
      listMultiProjectMonitoringUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerMultiProjectMonitoringWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerMultiProjectMonitoringWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerMultiProjectMonitoringWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerMultiProjectMonitoringWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listMultiProjectMonitoringUvlRows().length, readOnly: true };
}

export function registerMultiProjectMonitoringWithMultiProjectFoundation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectFoundation().passToken, readOnly: true };
}

export function registerMultiProjectMonitoringWithWorkspaceIsolation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2WorkspaceIsolationExpansion().passToken, readOnly: true };
}

export function registerMultiProjectMonitoringWithResourceAllocation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ResourceAllocation().passToken, readOnly: true };
}

export function registerMultiProjectMonitoringWithParallelBuildOrchestration(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ParallelBuildOrchestration().passToken, readOnly: true };
}

export function registerMultiProjectMonitoringWithMultiProjectVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectVerification().passToken, readOnly: true };
}

export function registerMultiProjectMonitoringWithVerificationOrchestration(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectVerificationOrchestration().passToken, readOnly: true };
}

export function registerMultiProjectMonitoringWithOperatorFeed(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2OperatorFeed().passToken, readOnly: true };
}

export function registerMultiProjectMonitoringWithLivePreview(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2LivePreviewRuntime().passToken, readOnly: true };
}

export interface RegisterProjectMonitorInput {
  projectId: string;
  workspaceId: string;
  status?: ProjectMonitorStatus;
  progress?: Partial<{ planning: number; build: number; testing: number; fixing: number; verification: number; completion: number }>;
  tabLabel?: string;
}

export function registerProjectMonitoring(input: RegisterProjectMonitorInput): ProjectMonitor {
  registerMultiProjectMonitoringWithCentralBrain();

  const feed = createProjectOperatorFeed(input.projectId);
  const streamId = createProjectEventStream(input.projectId);
  const timelineId = createProjectTimeline(input.projectId);
  const preview = createProjectLivePreview(input.projectId, input.workspaceId);
  createPreviewSession(input.projectId, input.workspaceId, input.tabLabel);

  appendProjectOperatorEvent(input.projectId, 'Monitoring initialized', 'progress');
  appendProjectEvent(input.projectId, 'PROGRESS', 'Monitoring session started');
  appendTimelineEvent(input.projectId, 'MONITORING', 'Project monitoring registered');

  if (input.progress) {
    updateProjectProgress(input.projectId, input.progress);
  } else {
    updateProjectProgress(input.projectId, { planning: 10 });
  }

  const monitor: ProjectMonitor = {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    status: input.status ?? 'ACTIVE',
    feedId: feed.feedId,
    streamId,
    timelineId,
    previewId: preview.previewId,
    registeredAt: Date.now(),
  };

  registerProjectMonitor(monitor);
  trackedProjectCount = getProjectMonitorCount();
  return monitor;
}

export function registerCoordinatedProjectMonitoring(
  specs: Array<{ name: string; type: string; status?: ProjectMonitorStatus; progress?: RegisterProjectMonitorInput['progress']; tabLabel?: string }>,
): { monitors: ProjectMonitor[]; report: ReturnType<typeof generateMonitoringReport> } {
  const monitors: ProjectMonitor[] = [];

  for (const spec of specs) {
    const { record: project } = coordinateProject({ projectName: spec.name, projectType: spec.type });
    coordinateWorkspace({ workspaceId: project.workspaceId, ownerProjectId: project.projectId });
    monitors.push(registerProjectMonitoring({
      projectId: project.projectId,
      workspaceId: project.workspaceId,
      status: spec.status,
      progress: spec.progress,
      tabLabel: spec.tabLabel,
    }));
  }

  const report = generateMonitoringReport();
  recordMonitoringHistory(report);
  trackedProjectCount = monitors.length;
  return { monitors, report };
}

export function getMultiProjectMonitoringRuntimeReport(): MonitoringRuntimeReport {
  const cache = getMonitoringCacheStats();
  return {
    projectCount: trackedProjectCount || getProjectMonitorCount(),
    feedCount: getProjectOperatorFeedCount(),
    timelineCount: getProjectTimelineCount(),
    previewCount: getProjectLivePreviewCount(),
    alertCount: getMonitoringAlertCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetMultiProjectMonitoringForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  trackedProjectCount = 0;
}
