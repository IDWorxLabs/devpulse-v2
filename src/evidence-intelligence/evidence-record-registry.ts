/**
 * Evidence Intelligence — evidence record registry and lookup.
 */

import type {
  EvidenceCategory,
  EvidenceRecord,
  EvidenceSourceId,
  EvidenceStatus,
  RawEvidenceInput,
} from './evidence-intelligence-types.js';
import { isKnownEvidenceSource } from './evidence-source-registry.js';

let evidenceCounter = 0;

const recordsById = new Map<string, EvidenceRecord>();
const recordsBySource = new Map<EvidenceSourceId, Set<string>>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByCategory = new Map<EvidenceCategory, Set<string>>();
const recordsByStatus = new Map<EvidenceStatus, Set<string>>();

function resolveSource(source: string): EvidenceSourceId {
  if (isKnownEvidenceSource(source)) return source;
  const upper = source.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  if (isKnownEvidenceSource(upper)) return upper;
  return 'TRUST_ENGINE';
}

function resolveCategory(category?: string): EvidenceCategory {
  const upper = (category ?? 'GENERAL').toUpperCase();
  const valid: EvidenceCategory[] = [
    'VERIFICATION', 'COMPLETION', 'GOVERNANCE', 'TRUST', 'MONITORING', 'TESTING', 'FIXING', 'GENERAL',
  ];
  return valid.includes(upper as EvidenceCategory) ? (upper as EvidenceCategory) : 'GENERAL';
}

function resolveStatus(status?: string): EvidenceStatus {
  if (!status) return 'UNKNOWN';
  const upper = status.toUpperCase();
  const valid: EvidenceStatus[] = ['ACTIVE', 'STALE', 'UNVERIFIED', 'CONFLICTED', 'BLOCKED', 'UNKNOWN'];
  return valid.includes(upper as EvidenceStatus) ? (upper as EvidenceStatus) : 'UNKNOWN';
}

function indexRecord(record: EvidenceRecord): void {
  const add = <K>(map: Map<K, Set<string>>, key: K, id: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(id);
  };
  add(recordsBySource, record.source, record.evidenceId);
  add(recordsByProject, record.project, record.evidenceId);
  add(recordsByWorkspace, record.workspace, record.evidenceId);
  add(recordsByCategory, record.category, record.evidenceId);
  add(recordsByStatus, record.status, record.evidenceId);
}

export function registerEvidenceRecord(
  input: RawEvidenceInput,
  defaults: { project?: string; workspace?: string } = {},
): EvidenceRecord {
  evidenceCounter += 1;

  const record: EvidenceRecord = {
    evidenceId: `evidence-${evidenceCounter}`,
    source: resolveSource(String(input.source)),
    project: input.project ?? defaults.project ?? 'default_project',
    workspace: input.workspace ?? defaults.workspace ?? 'default_workspace',
    category: resolveCategory(input.category),
    status: resolveStatus(input.status),
    strength: Math.max(0, Math.min(100, Math.round(input.strength ?? 50))),
    trustworthiness: Math.max(0, Math.min(100, Math.round(input.trustworthiness ?? 50))),
    reliability: Math.max(0, Math.min(100, Math.round(input.reliability ?? 50))),
    freshness: Math.max(0, Math.min(100, Math.round(input.freshness ?? 50))),
    claim: input.claim ?? '',
    timestamp: input.timestamp ?? Date.now(),
  };

  recordsById.set(record.evidenceId, record);
  indexRecord(record);
  return record;
}

export function registerEvidenceRecords(
  inputs: RawEvidenceInput[],
  defaults: { project?: string; workspace?: string } = {},
): EvidenceRecord[] {
  return inputs.map((input) => registerEvidenceRecord(input, defaults));
}

export function getEvidenceRecord(evidenceId: string): EvidenceRecord | undefined {
  return recordsById.get(evidenceId);
}

export function listEvidenceRecords(): EvidenceRecord[] {
  return [...recordsById.values()];
}

export function getEvidenceRecordCount(): number {
  return recordsById.size;
}

export function lookupEvidenceBySource(source: EvidenceSourceId): EvidenceRecord[] {
  const ids = recordsBySource.get(source);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)!).filter(Boolean);
}

export function lookupEvidenceByProject(project: string): EvidenceRecord[] {
  const ids = recordsByProject.get(project);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)!).filter(Boolean);
}

export function lookupEvidenceByWorkspace(workspace: string): EvidenceRecord[] {
  const ids = recordsByWorkspace.get(workspace);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)!).filter(Boolean);
}

export function lookupEvidenceByCategory(category: EvidenceCategory): EvidenceRecord[] {
  const ids = recordsByCategory.get(category);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)!).filter(Boolean);
}

export function lookupEvidenceByStatus(status: EvidenceStatus): EvidenceRecord[] {
  const ids = recordsByStatus.get(status);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)!).filter(Boolean);
}

export function lookupEvidenceByAuthority(authorityId: string): EvidenceRecord[] {
  return listEvidenceRecords().filter((r) => r.claim.includes(authorityId));
}

export function resetEvidenceRecordRegistryForTests(): void {
  recordsById.clear();
  recordsBySource.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByCategory.clear();
  recordsByStatus.clear();
  evidenceCounter = 0;
}
