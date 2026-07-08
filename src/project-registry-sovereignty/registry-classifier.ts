/**
 * Registry Sovereignty V1 — generic project classification and canonical name normalization.
 */

import type { ProjectRegistryRecord } from '../project-registry-v1/project-registry-v1-types.js';
import {
  PROJECT_KIND_AUDIT,
  PROJECT_KIND_SYSTEM_TEST,
  PROJECT_KIND_USER,
  inferProjectKindFromProjectId,
  resolveProjectKind,
  type ProjectKind,
} from '../project-registry-v1/project-kind.js';
import type { RegistryClass } from './types.js';

/** Canonical normalization for duplicate detection, resume, migration, and lookup. */
export function normalizeProjectRegistryName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function projectKindToRegistryClass(projectKind: ProjectKind): RegistryClass {
  if (projectKind === PROJECT_KIND_AUDIT) return 'AUDIT';
  if (projectKind === PROJECT_KIND_SYSTEM_TEST) return 'SYSTEM';
  return 'USER';
}

export function registryClassToProjectKind(registryClass: RegistryClass): ProjectKind {
  if (registryClass === 'AUDIT') return PROJECT_KIND_AUDIT;
  if (registryClass === 'SYSTEM') return PROJECT_KIND_SYSTEM_TEST;
  return PROJECT_KIND_USER;
}

function hasAuditMetadata(record: ProjectRegistryRecord): boolean {
  return Boolean(
    record.workspaceRealityAuditPath ||
      record.workspaceRealityAuditStatus ||
      record.materializationQualityVerdict?.toLowerCase().includes('audit'),
  );
}

function hasValidationMetadata(record: ProjectRegistryRecord): boolean {
  const summary = record.summary?.toLowerCase() ?? '';
  return summary.includes('validation') || summary.includes('validator run');
}

function inferFromRuntimeSource(record: ProjectRegistryRecord): RegistryClass | null {
  const sourceRoot = record.sourceRoot?.replace(/\\/g, '/').toLowerCase() ?? '';
  if (sourceRoot.includes('/.aidevengine-audit/')) return 'AUDIT';
  if (sourceRoot.includes('/.aidevengine-system/')) return 'SYSTEM';
  if (sourceRoot.includes('/.aidevengine-audit-validation/')) return 'AUDIT';
  return null;
}

export function classifyRegistryProject(
  record: Pick<ProjectRegistryRecord, 'projectId' | 'projectKind' | 'summary' | 'sourceRoot' | 'workspaceRealityAuditPath' | 'workspaceRealityAuditStatus' | 'materializationQualityVerdict'>,
): RegistryClass {
  const fromSource = inferFromRuntimeSource(record as ProjectRegistryRecord);
  if (fromSource) return fromSource;
  if (hasAuditMetadata(record as ProjectRegistryRecord)) return 'AUDIT';
  if (hasValidationMetadata(record as ProjectRegistryRecord)) return 'SYSTEM';
  return projectKindToRegistryClass(resolveProjectKind(record));
}

export function isUserRegistryClass(record: Pick<ProjectRegistryRecord, 'projectId' | 'projectKind'>): boolean {
  return classifyRegistryProject(record as ProjectRegistryRecord) === 'USER';
}

export function inferRegistryClassFromProjectId(projectId: string): RegistryClass {
  return projectKindToRegistryClass(inferProjectKindFromProjectId(projectId));
}
