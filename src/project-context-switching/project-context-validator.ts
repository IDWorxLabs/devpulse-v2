/**
 * Project Tab Context Switch — validation helpers for scripts.
 */

import type { ResolvedProjectContext } from './project-context-types.js';

export function isFullProjectContextLoaded(context: ResolvedProjectContext | null): boolean {
  if (!context) return false;
  return (
    Boolean(context.projectId) &&
    Boolean(context.projectName) &&
    context.loadedFromRegistry &&
    context.status !== 'NOT_FOUND'
  );
}

export function commandCenterShouldHideGreeting(context: ResolvedProjectContext | null): boolean {
  return Boolean(context?.projectId);
}

export function greetingAndProjectWarningWouldOverlap(input: {
  activeProjectId: string | null;
  welcomeVisible: boolean;
  projectWarningVisible: boolean;
}): boolean {
  return Boolean(input.activeProjectId && input.welcomeVisible && input.projectWarningVisible);
}

export function tabSwitchOnlyChangedVisualState(input: {
  clientActiveProjectId: string | null;
  registryActiveProjectId: string | null;
  contextLoaded: boolean;
}): boolean {
  if (!input.clientActiveProjectId) return false;
  if (input.clientActiveProjectId !== input.registryActiveProjectId) return true;
  return !input.contextLoaded;
}

export function livePreviewLinkedToProject(
  previewProjectId: string | null,
  activeProjectId: string | null,
): boolean {
  if (!activeProjectId) return false;
  return previewProjectId === activeProjectId;
}
