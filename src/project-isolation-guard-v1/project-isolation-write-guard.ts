/**
 * Project Isolation Guard V1 — write-path guards.
 */

import type { ProjectIsolationDomain, ProjectIsolationScope } from './project-isolation-guard-types.js';
import { workspacePathBelongsToProject } from './project-isolation-read-filter.js';

export class ProjectIsolationWriteError extends Error {
  readonly domain: ProjectIsolationDomain;
  readonly scope: ProjectIsolationScope;

  constructor(domain: ProjectIsolationDomain, scope: ProjectIsolationScope, message: string) {
    super(message);
    this.name = 'ProjectIsolationWriteError';
    this.domain = domain;
    this.scope = scope;
  }
}

export function requireProjectIdForWrite(
  projectId: string | null | undefined,
  input: { domain: ProjectIsolationDomain; scope?: ProjectIsolationScope },
): asserts projectId is string {
  if (!projectId?.trim()) {
    throw new ProjectIsolationWriteError(
      input.domain,
      input.scope ?? 'WRITE',
      `${input.domain} write rejected — projectId is required`,
    );
  }
}

export function assertRecordProjectId(
  recordProjectId: string | null | undefined,
  expectedProjectId: string,
  input: { domain: ProjectIsolationDomain; scope?: ProjectIsolationScope },
): void {
  requireProjectIdForWrite(expectedProjectId, input);
  if (recordProjectId !== expectedProjectId) {
    throw new ProjectIsolationWriteError(
      input.domain,
      input.scope ?? 'WRITE',
      `${input.domain} write rejected — record projectId ${recordProjectId ?? 'none'} does not match ${expectedProjectId}`,
    );
  }
}

export function assertWorkspacePathBelongsToProject(
  workspacePath: string | null | undefined,
  projectId: string,
): void {
  requireProjectIdForWrite(projectId, { domain: 'WORKSPACE', scope: 'WRITE' });
  if (!workspacePathBelongsToProject(workspacePath, projectId)) {
    throw new ProjectIsolationWriteError(
      'WORKSPACE',
      'WRITE',
      `Workspace path "${workspacePath ?? 'none'}" does not belong to project ${projectId}`,
    );
  }
}

export function assertBuildRunProjectMatch(
  buildRunProjectId: string | null | undefined,
  expectedProjectId: string,
): void {
  assertRecordProjectId(buildRunProjectId, expectedProjectId, { domain: 'BUILD_RUN', scope: 'BUILD' });
}

export function assertPreviewProjectMatch(
  previewProjectId: string | null | undefined,
  expectedProjectId: string,
): void {
  assertRecordProjectId(previewProjectId, expectedProjectId, { domain: 'LIVE_PREVIEW', scope: 'PREVIEW' });
}
