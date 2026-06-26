/**
 * Project Tab Context Switch — reset stale client/server warning state on workspace switch.
 */

import type { ProjectContextTraceEvent } from './project-context-types.js';
import { traceCommandCenterRenderStateReset, traceStaleProjectWarningsCleared } from './project-context-trace-events.js';

export interface ProjectContextResetSnapshot {
  readOnly: true;
  clearedAlignmentWarnings: boolean;
  clearedGreetingOverlap: boolean;
  commandCenterWorkspaceMode: boolean;
  projectId: string;
}

export function buildProjectContextResetSnapshot(projectId: string): ProjectContextResetSnapshot {
  return {
    readOnly: true,
    clearedAlignmentWarnings: true,
    clearedGreetingOverlap: true,
    commandCenterWorkspaceMode: Boolean(projectId),
    projectId,
  };
}

export function buildProjectContextResetTraceEvents(projectId: string): ProjectContextTraceEvent[] {
  return [
    traceStaleProjectWarningsCleared(projectId),
    traceCommandCenterRenderStateReset(projectId),
  ];
}
