/**
 * Project Tab Context Switch — execution trace event builders.
 */

import type { ProjectContextTraceEvent } from './project-context-types.js';

function stamp(): string {
  return new Date().toISOString();
}

export function traceProjectTabClicked(projectId: string, projectName?: string): ProjectContextTraceEvent {
  return {
    readOnly: true,
    eventType: 'Project tab clicked',
    eventTitle: 'Project tab clicked',
    technicalDetail: `User selected workspace tab for ${projectName ?? projectId}.`,
    runtimeStage: 'Project Context',
    timestamp: stamp(),
    projectId,
  };
}

export function traceProjectContextLoadStarted(projectId: string): ProjectContextTraceEvent {
  return {
    readOnly: true,
    eventType: 'Project context load started',
    eventTitle: 'Project context load started',
    technicalDetail: `Loading full project context for ${projectId}.`,
    runtimeStage: 'Project Context',
    timestamp: stamp(),
    projectId,
  };
}

export function traceRegistryProjectRecordLoaded(
  projectId: string,
  projectName: string,
): ProjectContextTraceEvent {
  return {
    readOnly: true,
    eventType: 'Registry project record loaded',
    eventTitle: 'Registry project record loaded',
    technicalDetail: `Registry record loaded — ${projectName} (${projectId}).`,
    runtimeStage: 'Project Context',
    timestamp: stamp(),
    projectId,
  };
}

export function tracePersistentProjectMetadataLoaded(
  projectId: string,
  path: string | null,
): ProjectContextTraceEvent {
  return {
    readOnly: true,
    eventType: 'Persistent project metadata loaded',
    eventTitle: 'Persistent project metadata loaded',
    technicalDetail: path
      ? `Persistent workspace metadata loaded from ${path}.`
      : 'No persistent workspace metadata found for project.',
    runtimeStage: 'Project Context',
    timestamp: stamp(),
    projectId,
  };
}

export function traceProjectContextRestored(projectId: string, domain: string): ProjectContextTraceEvent {
  return {
    readOnly: true,
    eventType: 'Project context restored',
    eventTitle: 'Project context restored',
    technicalDetail: `Project domain restored — ${domain}.`,
    runtimeStage: 'Project Context',
    timestamp: stamp(),
    projectId,
  };
}

export function traceStaleProjectWarningsCleared(projectId: string): ProjectContextTraceEvent {
  return {
    readOnly: true,
    eventType: 'Stale project warnings cleared',
    eventTitle: 'Stale project warnings cleared',
    technicalDetail: 'Previous project alignment and mismatch warnings cleared for Command Center.',
    runtimeStage: 'Project Context',
    timestamp: stamp(),
    projectId,
  };
}

export function traceCommandCenterRenderStateReset(projectId: string): ProjectContextTraceEvent {
  return {
    readOnly: true,
    eventType: 'Command Center render state reset',
    eventTitle: 'Command Center render state reset',
    technicalDetail: 'Command Center workspace render state reset — greeting/home suppressed for active project.',
    runtimeStage: 'Project Context',
    timestamp: stamp(),
    projectId,
  };
}

export function traceProjectTabContextSwitchCompleted(
  projectId: string,
  projectName: string,
): ProjectContextTraceEvent {
  return {
    readOnly: true,
    eventType: 'Project tab context switch completed',
    eventTitle: 'Project tab context switch completed',
    technicalDetail: `Workspace switch completed — active project is now ${projectName}.`,
    runtimeStage: 'Project Context',
    timestamp: stamp(),
    projectId,
  };
}

export function tracePromptClassificationUsedActiveProjectContext(
  projectId: string,
  projectName: string,
): ProjectContextTraceEvent {
  return {
    readOnly: true,
    eventType: 'Prompt classification used active project context',
    eventTitle: 'Prompt classification used active project context',
    technicalDetail: `Classification used active project context — ${projectName} (${projectId}).`,
    runtimeStage: 'Project Context',
    timestamp: stamp(),
    projectId,
  };
}

export function traceProjectAlignmentPassed(projectId: string, reason: string): ProjectContextTraceEvent {
  return {
    readOnly: true,
    eventType: 'Project alignment passed',
    eventTitle: 'Project alignment passed',
    technicalDetail: reason,
    runtimeStage: 'Project Context',
    timestamp: stamp(),
    projectId,
  };
}
