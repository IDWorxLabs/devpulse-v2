/**
 * Registry Sovereignty V1 — duplicate and metadata repair within a registry file.
 */

import type {
  ProjectRegistryFile,
  ProjectRegistryRecord,
} from '../project-registry-v1/project-registry-v1-types.js';
import { registryClassToProjectKind, classifyRegistryProject, normalizeProjectRegistryName } from './registry-classifier.js';
import { repairUserActiveProjectId } from './registry-active-project-authority.js';
import type { RegistryDuplicateRepairRecord } from './types.js';

function nowIso(): string {
  return new Date().toISOString();
}

function touchRecord(record: ProjectRegistryRecord): void {
  const stamp = nowIso();
  record.updatedAt = stamp;
  record.lastActivityAt = stamp;
}

export function repairDuplicateNormalizedNames(
  state: ProjectRegistryFile,
): { mutated: boolean; repairs: RegistryDuplicateRepairRecord[] } {
  let mutated = false;
  const repairs: RegistryDuplicateRepairRecord[] = [];

  for (const record of state.projects) {
    const trimmed = record.name.trim();
    if (trimmed !== record.name) {
      record.name = trimmed;
      touchRecord(record);
      mutated = true;
    }
    const registryClass = classifyRegistryProject(record);
    const kind = registryClassToProjectKind(registryClass);
    if (record.projectKind !== kind) {
      record.projectKind = kind;
      touchRecord(record);
      mutated = true;
    }
  }

  const activeByNormalizedName = new Map<string, ProjectRegistryRecord[]>();
  for (const record of state.projects) {
    if (record.status !== 'ACTIVE') continue;
    if (classifyRegistryProject(record) !== 'USER') continue;
    const normalized = normalizeProjectRegistryName(record.name);
    const group = activeByNormalizedName.get(normalized) ?? [];
    group.push(record);
    activeByNormalizedName.set(normalized, group);
  }

  // Normalize whitespace + projectKind only. Multiple ACTIVE USER projects may share a display
  // name when each has a distinct projectId (genuine fresh builds of the same product).
  for (const [normalizedName, group] of activeByNormalizedName) {
    if (group.length <= 1) continue;
    // Record awareness without archiving — same-name isolation is intentional.
    repairs.push({
      readOnly: true,
      normalizedName,
      keptProjectId: group.map((g) => g.projectId).sort().join(','),
      archivedProjectIds: [],
    });
  }

  const repairedActive = repairUserActiveProjectId(state);
  if (repairedActive !== state.activeProjectId) {
    mutated = true;
  }

  return { mutated, repairs };
}
