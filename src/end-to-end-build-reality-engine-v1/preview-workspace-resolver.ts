/**
 * Resolves which workspace directory Vite actually serves for preview authority checks.
 */

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { WORKSPACE_ROOT_DIR } from '../build-materialization-reality/build-materialization-reality-registry.js';
import { listGeneratedDevServers } from '../one-prompt-live-preview/generated-dev-server-manager.js';

function normalizeDir(dir: string | null | undefined): string | null {
  if (!dir) return null;
  return resolve(dir).replace(/\\/g, '/').toLowerCase();
}

function previewUrlPort(previewUrl: string | null | undefined): number | null {
  if (!previewUrl) return null;
  try {
    return new URL(previewUrl).port ? Number(new URL(previewUrl).port) : null;
  } catch {
    return null;
  }
}

function urlsEquivalent(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  try {
    const left = new URL(a);
    const right = new URL(b);
    return left.origin === right.origin && left.pathname.replace(/\/$/, '') === right.pathname.replace(/\/$/, '');
  } catch {
    return false;
  }
}

export function resolveBuilderWorkspaceDir(input: {
  artifactRoot: string;
  projectId: string;
}): string {
  return join(input.artifactRoot, WORKSPACE_ROOT_DIR, input.projectId);
}

export function resolvePreviewServingWorkspaceDir(input: {
  projectId: string;
  artifactRoot: string;
  previewUrl?: string | null;
  activeWorkspaceDir?: string | null;
}): string | null {
  const port = previewUrlPort(input.previewUrl);
  for (const server of listGeneratedDevServers()) {
    if (port != null && server.port === port) {
      return server.workspaceDir;
    }
    if (input.previewUrl && urlsEquivalent(server.url, input.previewUrl)) {
      return server.workspaceDir;
    }
  }

  const builderWorkspaceDir = resolveBuilderWorkspaceDir({
    artifactRoot: input.artifactRoot,
    projectId: input.projectId,
  });
  if (existsSync(builderWorkspaceDir)) {
    return builderWorkspaceDir;
  }

  return input.activeWorkspaceDir ?? null;
}

export function previewWorkspacePathsAligned(
  previewServingWorkspaceDir: string | null,
  activeProjectWorkspaceDir: string | null,
): boolean {
  const serving = normalizeDir(previewServingWorkspaceDir);
  const active = normalizeDir(activeProjectWorkspaceDir);
  if (!serving || !active) return true;
  return serving === active;
}
