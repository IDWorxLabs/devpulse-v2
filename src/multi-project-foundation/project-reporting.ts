/**
 * Multi Project Foundation — project report generation.
 */

import type { ProjectReport } from './multi-project-types.js';
import { getProject } from './project-registry.js';
import { getProjectContext } from './project-context-manager.js';
import { getProjectHistory } from './project-history-manager.js';
import { evaluateProjectLifecycle } from './project-lifecycle-manager.js';
import { validateProjectIsolation } from './project-isolation-policy.js';
import { getWorkspace } from './project-workspace-mapper.js';

let reportCounter = 0;

export function generateProjectReport(projectId: string): ProjectReport | undefined {
  const record = getProject(projectId);
  if (!record) return undefined;

  reportCounter += 1;

  const lifecycle = evaluateProjectLifecycle(record);
  const context = getProjectContext(projectId);
  const isolation = validateProjectIsolation(projectId, projectId);
  const history = getProjectHistory(projectId, 5);

  return {
    reportId: `project-report-${reportCounter}`,
    projectId: record.projectId,
    projectName: record.projectName,
    projectType: record.projectType,
    state: record.state,
    workspaceId: getWorkspace(projectId) ?? record.workspaceId,
    lifecycleStatus: lifecycle.status,
    contextStatus: context ? 'context present' : 'no context',
    isolationStatus: isolation.status,
    historySummary: history.map((h) => `${h.eventType}: ${h.detail}`),
    generatedAt: Date.now(),
  };
}

export function resetProjectReportCounterForTests(): void {
  reportCounter = 0;
}
