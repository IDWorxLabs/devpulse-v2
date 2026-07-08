/**
 * Project Lifecycle Management V1 — runtime teardown before delete or archive.
 */

import { getActiveProjectId } from '../one-prompt-live-preview/workspace-tab-registry.js';
import { stopGeneratedDevServersForProject } from '../one-prompt-live-preview/generated-dev-server-manager.js';
import { closePreviewSessionsForProject } from '../live-preview-runtime/preview-session-manager.js';
import {
  clearActiveProjectIfMatches,
  removeWorkspaceSession,
} from '../one-prompt-live-preview/workspace-tab-registry.js';

export interface ProjectRuntimeTeardownResult {
  readOnly: true;
  devServersStopped: number;
  previewSessionsClosed: number;
  workspaceSessionRemoved: boolean;
  activeProjectCleared: boolean;
}

export async function teardownProjectRuntime(projectId: string): Promise<ProjectRuntimeTeardownResult> {
  const devServersStopped = await stopGeneratedDevServersForProject(projectId);
  const previewSessionsClosed = closePreviewSessionsForProject(projectId);
  const workspaceSessionRemoved = removeWorkspaceSession(projectId);
  const wasActive = getActiveProjectId() === projectId;
  const activeProjectCleared = wasActive ? clearActiveProjectIfMatches(projectId) : false;

  return {
    readOnly: true,
    devServersStopped,
    previewSessionsClosed,
    workspaceSessionRemoved,
    activeProjectCleared,
  };
}
