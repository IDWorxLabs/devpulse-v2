/**
 * Project Registry V1 — user vs audit/system-test project classification.
 */

import type { ProjectRegistryRecord } from './project-registry-v1-types.js';

export type ProjectKind = 'USER' | 'AUDIT' | 'SYSTEM_TEST';

export const PROJECT_KIND_USER: ProjectKind = 'USER';
export const PROJECT_KIND_AUDIT: ProjectKind = 'AUDIT';
export const PROJECT_KIND_SYSTEM_TEST: ProjectKind = 'SYSTEM_TEST';

/** Generic project-id prefixes used by validators and audits — not app-specific. */
const AUDIT_PROJECT_ID_PREFIXES = [
  'readiness-audit-',
  'build-readiness-audit-',
  'aee-live-',
  'aee-profile-',
  'aee-build-',
  'aee-preview-',
  'aee-build-autofix-',
] as const;

const SYSTEM_TEST_PROJECT_ID_PREFIXES = [
  'validation-',
  'system-test-',
  'ael-live-',
  'devpulse-build-intent-',
  'devpulse-registry-test-',
  'quality-',
  'history-',
  'forensic-',
  'plan-fail-',
  'mat-fail-',
  'mat-evidence-',
  'aee-',
  'parity-test-',
  'one-prompt-build-',
] as const;

const SYSTEM_TEST_PROJECT_ID_PATTERNS = [
  /^devpulse-.*-test-/,
  /^one-prompt-build-\d+-dup-/,
  /^[a-z][a-z0-9-]*-\d{13}$/,
] as const;

export function inferProjectKindFromProjectId(projectId: string): ProjectKind {
  const normalized = projectId.trim().toLowerCase();
  if (!normalized) return PROJECT_KIND_USER;

  for (const prefix of AUDIT_PROJECT_ID_PREFIXES) {
    if (normalized.startsWith(prefix)) return PROJECT_KIND_AUDIT;
  }
  for (const prefix of SYSTEM_TEST_PROJECT_ID_PREFIXES) {
    if (normalized.startsWith(prefix)) return PROJECT_KIND_SYSTEM_TEST;
  }
  for (const pattern of SYSTEM_TEST_PROJECT_ID_PATTERNS) {
    if (pattern.test(normalized)) return PROJECT_KIND_SYSTEM_TEST;
  }
  return PROJECT_KIND_USER;
}

export function resolveProjectKind(
  record: Pick<ProjectRegistryRecord, 'projectId' | 'projectKind'>,
): ProjectKind {
  return record.projectKind ?? inferProjectKindFromProjectId(record.projectId);
}

export function isUserFacingRegistryProject(
  record: Pick<ProjectRegistryRecord, 'projectId' | 'projectKind' | 'status'>,
): boolean {
  if (record.status !== 'ACTIVE') return false;
  return resolveProjectKind(record) === PROJECT_KIND_USER;
}

export function isTestOrAuditRegistryProject(
  record: Pick<ProjectRegistryRecord, 'projectId' | 'projectKind'>,
): boolean {
  const kind = resolveProjectKind(record);
  return kind === PROJECT_KIND_AUDIT || kind === PROJECT_KIND_SYSTEM_TEST;
}

export function shouldHideProjectFromCommandCenter(
  record: Pick<ProjectRegistryRecord, 'projectId' | 'projectKind' | 'status'>,
  includeSystemProjects: boolean,
): boolean {
  if (record.status !== 'ACTIVE') return true;
  if (includeSystemProjects) return false;
  return !isUserFacingRegistryProject(record);
}
