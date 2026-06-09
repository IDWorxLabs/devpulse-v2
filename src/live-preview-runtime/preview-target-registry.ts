/**
 * Preview target registry — metadata and ownership associations.
 */

import type { PreviewTargetMetadata, PreviewTargetType } from './types.js';
import { LIVE_PREVIEW_RUNTIME_OWNER_MODULE } from './types.js';

let targetCounter = 0;
const targets = new Map<string, PreviewTargetMetadata>();

function nextTargetId(): string {
  targetCounter += 1;
  return `pvtgt-${targetCounter.toString().padStart(4, '0')}`;
}

function targetKey(projectId: string, workspaceId: string, targetName: string): string {
  return `${projectId}|${workspaceId}|${targetName.toLowerCase()}`;
}

export function resetPreviewTargetRegistryForTests(): void {
  targetCounter = 0;
  targets.clear();
}

export function registerPreviewTarget(opts: {
  targetName: string;
  targetType: PreviewTargetType;
  projectId: string;
  workspaceId: string;
  previewUrl?: string | null;
  runtimeAssociation?: string;
  allowDuplicate?: boolean;
}): { target: PreviewTargetMetadata | null; duplicate: boolean } {
  const key = targetKey(opts.projectId, opts.workspaceId, opts.targetName);
  if (targets.has(key) && !opts.allowDuplicate) {
    return { target: null, duplicate: true };
  }

  const target: PreviewTargetMetadata = {
    targetId: nextTargetId(),
    targetName: opts.targetName,
    targetType: opts.targetType,
    projectId: opts.projectId,
    workspaceId: opts.workspaceId,
    runtimeAssociation: opts.runtimeAssociation ?? 'live_preview_runtime',
    ownerModule: LIVE_PREVIEW_RUNTIME_OWNER_MODULE,
    previewUrl: opts.previewUrl ?? null,
    registeredAt: Date.now(),
  };

  targets.set(key, target);
  return { target, duplicate: false };
}

export function getPreviewTarget(
  projectId: string,
  workspaceId: string,
  targetName: string,
): PreviewTargetMetadata | null {
  return targets.get(targetKey(projectId, workspaceId, targetName)) ?? null;
}

export function listPreviewTargets(): PreviewTargetMetadata[] {
  return [...targets.values()];
}

export function hasPreviewTarget(
  projectId: string,
  workspaceId: string,
  targetName: string,
): boolean {
  return targets.has(targetKey(projectId, workspaceId, targetName));
}
