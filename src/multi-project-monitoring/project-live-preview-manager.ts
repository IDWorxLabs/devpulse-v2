/**
 * Multi Project Monitoring — isolated live preview per project.
 */

import type { ProjectLivePreview } from './monitoring-types.js';

const previews = new Map<string, ProjectLivePreview>();

let previewCounter = 0;

export function createProjectLivePreview(projectId: string, workspaceId: string): ProjectLivePreview {
  if (previews.has(projectId)) {
    return previews.get(projectId)!;
  }

  previewCounter += 1;
  const preview: ProjectLivePreview = {
    projectId,
    previewId: `live-preview-${projectId}-${previewCounter}`,
    workspaceId,
    active: true,
  };

  previews.set(projectId, preview);
  return preview;
}

export function getProjectLivePreview(projectId: string): ProjectLivePreview | undefined {
  return previews.get(projectId);
}

export function listProjectLivePreviews(): ProjectLivePreview[] {
  return [...previews.values()];
}

export function getProjectLivePreviewCount(): number {
  return previews.size;
}

export function resetProjectLivePreviewManagerForTests(): void {
  previews.clear();
  previewCounter = 0;
}
