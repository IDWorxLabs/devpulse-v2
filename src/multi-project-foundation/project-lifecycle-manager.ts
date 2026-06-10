/**
 * Multi Project Foundation — project lifecycle evaluation.
 */

import type { MultiProjectRecord, MultiProjectState, ProjectLifecycleStatus, ProjectLifecycleSummary } from './multi-project-types.js';

function stateToLifecycle(state: MultiProjectState): ProjectLifecycleStatus {
  switch (state) {
    case 'PAUSED':
      return 'PAUSED';
    case 'ARCHIVED':
      return 'ARCHIVED';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'ACTIVE';
  }
}

export function evaluateProjectLifecycle(record: MultiProjectRecord): ProjectLifecycleSummary {
  const status = stateToLifecycle(record.state);
  const summary = `Project ${record.projectName} (${record.projectId}) is ${status.toLowerCase()} in state ${record.state}`;

  return {
    projectId: record.projectId,
    status,
    state: record.state,
    summary,
  };
}
