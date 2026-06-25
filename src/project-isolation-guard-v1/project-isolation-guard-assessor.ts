/**
 * Project Isolation Guard V1 — assess cross-project data boundaries.
 */

import { listBuildIntentRuns } from '../build-intent-routing/build-intent-run-store.js';
import { listPreviewSessions } from '../live-preview-runtime/preview-session-manager.js';
import { listGeneratedDevServers } from '../one-prompt-live-preview/generated-dev-server-manager.js';
import { listMultiProjectWorkspaces } from '../one-prompt-live-preview/workspace-tab-registry.js';
import { getProjectContextMetadata, listProjectContextMetadata } from '../project-context-alignment-v1/project-context-metadata-store.js';
import type {
  ProjectIsolationCheckResult,
  ProjectIsolationDomain,
  ProjectIsolationVerdict,
  ProjectIsolationViolation,
  ProjectScopedRecord,
} from './project-isolation-guard-types.js';
import {
  detectCrossProjectLeaks,
  filterBuildRunsByProject,
  filterLivePreviewsByProject,
  filterMemoryByProject,
  filterOperatorEventsByProject,
  filterNotificationsByProject,
  filterWorkspacesByProject,
  workspacePathBelongsToProject,
} from './project-isolation-read-filter.js';

function verdictFromViolations(violations: ProjectIsolationViolation[]): ProjectIsolationVerdict {
  if (violations.length === 0) return 'ISOLATED';
  const hasMissingProjectId = violations.some((v) => v.recordProjectId === null);
  return hasMissingProjectId ? 'LEAK_RISK' : 'VIOLATION';
}

function mergeViolations(...groups: ProjectIsolationViolation[][]): ProjectIsolationViolation[] {
  return groups.flat();
}

export function assessProjectIsolationForViewer(input: {
  viewerProjectId: string;
  rootDir?: string;
  chatMessages?: ProjectScopedRecord[];
  plans?: ProjectScopedRecord[];
  founderTestReports?: ProjectScopedRecord[];
  validationReports?: ProjectScopedRecord[];
  operatorEvents?: Array<ProjectScopedRecord & { scope?: string }>;
  notifications?: Array<ProjectScopedRecord & { scope?: string }>;
  insights?: ProjectScopedRecord[];
  runtimeStates?: ProjectScopedRecord[];
}): ProjectIsolationCheckResult {
  const viewerProjectId = input.viewerProjectId;
  const rootDir = input.rootDir;
  const checkedDomains: ProjectIsolationDomain[] = [];

  const buildRuns = filterBuildRunsByProject(listBuildIntentRuns(rootDir), viewerProjectId);
  checkedDomains.push('BUILD_RUN');
  const buildRunViolations = detectCrossProjectLeaks(viewerProjectId, buildRuns, {
    domain: 'BUILD_RUN',
    scope: 'READ',
  });

  const workspaces = filterWorkspacesByProject(listMultiProjectWorkspaces(), viewerProjectId);
  checkedDomains.push('WORKSPACE');
  const workspaceViolations = detectCrossProjectLeaks(viewerProjectId, workspaces, {
    domain: 'WORKSPACE',
    scope: 'READ',
  });

  const previews = filterLivePreviewsByProject(listPreviewSessions(), viewerProjectId);
  checkedDomains.push('LIVE_PREVIEW');
  const previewViolations = detectCrossProjectLeaks(viewerProjectId, previews, {
    domain: 'LIVE_PREVIEW',
    scope: 'READ',
  });

  const devServers = filterLivePreviewsByProject(listGeneratedDevServers(), viewerProjectId);
  checkedDomains.push('RUNTIME');
  const runtimeViolations = detectCrossProjectLeaks(viewerProjectId, devServers, {
    domain: 'RUNTIME',
    scope: 'READ',
  });

  const memoryRecords = filterMemoryByProject(
    listProjectContextMetadata(rootDir).map((meta) => ({
      projectId: meta.projectId,
      domain: meta.domain,
    })),
    viewerProjectId,
  );
  checkedDomains.push('MEMORY');
  const memoryViolations = detectCrossProjectLeaks(viewerProjectId, memoryRecords, {
    domain: 'MEMORY',
    scope: 'READ',
  });

  const chatViolations = input.chatMessages
    ? detectCrossProjectLeaks(viewerProjectId, input.chatMessages, { domain: 'CHAT', scope: 'READ' })
    : [];
  if (input.chatMessages) checkedDomains.push('CHAT');

  const planViolations = input.plans
    ? detectCrossProjectLeaks(viewerProjectId, input.plans, { domain: 'PLAN', scope: 'READ' })
    : [];
  if (input.plans) checkedDomains.push('PLAN');

  const founderTestViolations = input.founderTestReports
    ? detectCrossProjectLeaks(viewerProjectId, input.founderTestReports, {
        domain: 'FOUNDER_TEST',
        scope: 'READ',
      })
    : [];
  if (input.founderTestReports) checkedDomains.push('FOUNDER_TEST');

  const validationViolations = input.validationReports
    ? detectCrossProjectLeaks(viewerProjectId, input.validationReports, {
        domain: 'VALIDATION',
        scope: 'READ',
      })
    : [];
  if (input.validationReports) checkedDomains.push('VALIDATION');

  const operatorViolations = input.operatorEvents
    ? detectCrossProjectLeaks(
        viewerProjectId,
        filterOperatorEventsByProject(input.operatorEvents, viewerProjectId, { includeGlobal: true }),
        { domain: 'OPERATOR_FEED', scope: 'READ' },
      )
    : [];
  if (input.operatorEvents) checkedDomains.push('OPERATOR_FEED');

  const notificationViolations = input.notifications
    ? detectCrossProjectLeaks(
        viewerProjectId,
        filterNotificationsByProject(input.notifications, viewerProjectId, { includeGlobal: true }),
        { domain: 'NOTIFICATION', scope: 'READ' },
      )
    : [];
  if (input.notifications) checkedDomains.push('NOTIFICATION');

  const insightViolations = input.insights
    ? detectCrossProjectLeaks(viewerProjectId, input.insights, { domain: 'INSIGHT', scope: 'READ' })
    : [];
  if (input.insights) checkedDomains.push('INSIGHT');

  const extraRuntimeViolations = input.runtimeStates
    ? detectCrossProjectLeaks(viewerProjectId, input.runtimeStates, { domain: 'RUNTIME', scope: 'READ' })
    : [];

  const workspacePathViolations: ProjectIsolationViolation[] = [];
  for (const workspace of workspaces) {
    if (workspace.workspacePath && !workspacePathBelongsToProject(workspace.workspacePath, viewerProjectId)) {
      workspacePathViolations.push({
        readOnly: true,
        domain: 'ARTIFACT',
        scope: 'READ',
        viewerProjectId,
        recordProjectId: workspace.projectId ?? null,
        detail: `Workspace artifact path leak for ${viewerProjectId}`,
      });
    }
  }
  if (workspacePathViolations.length) checkedDomains.push('ARTIFACT');

  const metadata = getProjectContextMetadata(viewerProjectId, rootDir);
  if (metadata && metadata.projectId !== viewerProjectId) {
    workspacePathViolations.push({
      readOnly: true,
      domain: 'MEMORY',
      scope: 'READ',
      viewerProjectId,
      recordProjectId: metadata.projectId,
      detail: `Metadata projectId mismatch for ${viewerProjectId}`,
    });
  }

  const violations = mergeViolations(
    buildRunViolations,
    workspaceViolations,
    previewViolations,
    runtimeViolations,
    memoryViolations,
    chatViolations,
    planViolations,
    founderTestViolations,
    validationViolations,
    operatorViolations,
    notificationViolations,
    insightViolations,
    extraRuntimeViolations,
    workspacePathViolations,
  );

  return {
    readOnly: true,
    verdict: verdictFromViolations(violations),
    viewerProjectId,
    violations,
    checkedDomains: [...new Set(checkedDomains)],
  };
}

export function isolationBlocksCrossProjectAccess(result: ProjectIsolationCheckResult): boolean {
  return result.verdict === 'VIOLATION';
}

export function assertProjectIsolation(input: {
  viewerProjectId: string;
  rootDir?: string;
  chatMessages?: ProjectScopedRecord[];
  plans?: ProjectScopedRecord[];
}): ProjectIsolationCheckResult {
  const result = assessProjectIsolationForViewer(input);
  if (isolationBlocksCrossProjectAccess(result)) {
    throw new Error(result.violations.map((v) => v.detail).join('; '));
  }
  return result;
}
