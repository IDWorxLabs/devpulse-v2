/**
 * Project Lifecycle Management V1 — HTTP handlers.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  archiveRegistryProject,
  renameRegistryProject,
} from '../src/project-registry-v1/index.js';
import {
  PROJECT_DELETED_SUCCESSFULLY,
  auditProjectOwnership,
  deleteOrphanPath,
  deleteProjectLifecycle,
  discoverProjectArtifacts,
  duplicateProjectLifecycle,
  restoreProjectLifecycle,
} from '../src/project-lifecycle-management-v1/index.js';
import type { ProjectDeleteAuditStep, ProjectOwnershipArtifact } from '../src/project-lifecycle-management-v1/project-lifecycle-types.js';
import { buildRegistryGetResponse } from './project-registry-handler.js';

export const DELETION_PREVIEW_REQUIRES_CONFIRMATION = 'DELETION_PREVIEW_REQUIRES_CONFIRMATION' as const;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'project-lifecycle-v1',
  });
  res.end(JSON.stringify(body, null, 2));
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

export async function handleProjectLifecycleMutation(
  req: IncomingMessage,
  res: ServerResponse,
  action:
    | 'delete'
    | 'duplicate'
    | 'restore'
    | 'archive'
    | 'rename'
    | 'ownership-audit'
    | 'delete-orphan',
  rootDir: string,
): Promise<void> {
  try {
    const body = await readJsonBody(req);

    if (action === 'ownership-audit') {
      const audit = auditProjectOwnership(rootDir);
      sendJson(res, 200, { ok: true, action, audit });
      return;
    }

    if (action === 'delete-orphan') {
      const orphanPath = String(body.orphanPath ?? '').trim();
      if (!orphanPath) {
        sendJson(res, 400, { ok: false, error: 'orphanPath is required' });
        return;
      }
      const removed = deleteOrphanPath(rootDir, orphanPath);
      sendJson(res, 200, {
        ok: removed,
        action,
        orphanPath,
        removed,
        audit: auditProjectOwnership(rootDir),
      });
      return;
    }

    const projectId = String(body.projectId ?? '').trim();
    if (!projectId) {
      sendJson(res, 400, { ok: false, error: 'projectId is required' });
      return;
    }

    if (action === 'delete') {
      const confirmed = body.confirmed === true || body.confirm === true;
      if (!confirmed) {
        const discovery = discoverProjectArtifacts(projectId, rootDir);
        const ownershipAudit = auditProjectOwnership(rootDir);
        sendJson(res, 200, {
          ok: true,
          projectId,
          deleted: false,
          auditSteps: buildDeletePreviewAuditSteps(discovery.artifacts),
          orphanCount: ownershipAudit.orphanCount,
          message: DELETION_PREVIEW_REQUIRES_CONFIRMATION,
          requiresConfirmation: true,
          artifacts: discovery.artifacts,
          action: 'delete-preview',
        });
        return;
      }
      const result = await deleteProjectLifecycle({ projectId, rootDir, confirmed: true });
      const ownershipAudit = auditProjectOwnership(rootDir);
      sendJson(res, result.ok ? 200 : 500, {
        ...buildRegistryGetResponse(rootDir),
        ...buildDeleteResponse(result, ownershipAudit.orphanCount),
        action: 'delete',
      });
      return;
    }

    if (action === 'duplicate') {
      const newName = body.newName ? String(body.newName) : undefined;
      const result = duplicateProjectLifecycle({ sourceProjectId: projectId, rootDir, newName });
      sendJson(res, result.ok ? 200 : 400, {
        ...buildRegistryGetResponse(rootDir),
        ...result,
        action: 'duplicate',
      });
      return;
    }

    if (action === 'restore') {
      const result = restoreProjectLifecycle({ projectId, rootDir });
      sendJson(res, result.ok ? 200 : 400, {
        ...buildRegistryGetResponse(rootDir),
        ...result,
        action: 'restore',
      });
      return;
    }

    if (action === 'archive') {
      const record = archiveRegistryProject({ projectId, rootDir });
      sendJson(res, 200, {
        ...buildRegistryGetResponse(rootDir),
        project: record,
        action: 'archive',
      });
      return;
    }

    if (action === 'rename') {
      const name = String(body.name ?? '').trim();
      const record = renameRegistryProject({ projectId, name, rootDir });
      sendJson(res, 200, {
        ...buildRegistryGetResponse(rootDir),
        project: record,
        action: 'rename',
      });
      return;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sendJson(res, 400, { ok: false, error: message });
  }
}

export function handleProjectLifecycleGet(
  res: ServerResponse,
  rootDir: string,
  subPath: string,
): void {
  if (subPath === 'ownership-audit') {
    const audit = auditProjectOwnership(rootDir);
    sendJson(res, 200, { ok: true, audit });
    return;
  }

  const projectId = subPath.replace(/^artifacts\//, '').trim();
  if (subPath.startsWith('artifacts/') && projectId) {
    const discovery = discoverProjectArtifacts(projectId, rootDir);
    sendJson(res, 200, { ok: true, discovery });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Unknown lifecycle GET path' });
}

function buildDeletePreviewAuditSteps(artifacts: ProjectOwnershipArtifact[]): ProjectDeleteAuditStep[] {
  return artifacts.map((artifact) => ({
    readOnly: true as const,
    label: artifact.artifactType,
    path: artifact.path,
    status: 'SKIPPED' as const,
    detail: 'Pending confirmation',
  }));
}

function buildDeleteResponse(
  result: Awaited<ReturnType<typeof deleteProjectLifecycle>>,
  orphanCount: number,
): Record<string, unknown> {
  return {
    ok: result.ok,
    projectId: result.projectId,
    deleted: result.ok,
    projectName: result.projectName,
    auditSteps: result.auditSteps,
    orphanCount,
    orphanedFilesDetected: result.orphanedFilesDetected,
    runtimeTeardown: result.runtimeTeardown,
    noOrphanedFilesDetected: result.orphanedFilesDetected.length === 0,
    message: result.ok ? PROJECT_DELETED_SUCCESSFULLY : (result.error ?? 'PROJECT_DELETE_FAILED'),
    deleteOk: result.ok,
    token: result.token,
    deleteError: result.error,
  };
}
