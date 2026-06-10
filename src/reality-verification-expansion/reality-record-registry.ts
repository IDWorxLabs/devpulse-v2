/**
 * Reality Verification Expansion — reality record registry and lookup.
 */

import type {
  RealityCategory,
  RealityClaimType,
  RealityRecord,
  RealityRecordStatus,
  RealitySourceId,
  RealityVerificationState,
  RawRealityClaimInput,
} from './reality-verification-types.js';
import { isKnownRealitySource } from './reality-source-registry.js';

let recordCounter = 0;

const recordsById = new Map<string, RealityRecord>();
const recordsBySource = new Map<RealitySourceId, Set<string>>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByCategory = new Map<RealityCategory, Set<string>>();
const recordsByStatus = new Map<RealityRecordStatus, Set<string>>();
const recordsByVerificationState = new Map<RealityVerificationState, Set<string>>();

const CLAIM_TYPES: RealityClaimType[] = [
  'build_completed',
  'verification_passed',
  'trust_established',
  'completion_verified',
  'project_healthy',
  'governance_approved',
];

function resolveSource(source?: string): RealitySourceId {
  if (source && isKnownRealitySource(source)) return source;
  if (source) {
    const upper = source.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (isKnownRealitySource(upper)) return upper;
  }
  return 'TRUST_ENGINE';
}

function resolveClaimType(claimType: string): RealityClaimType {
  const normalized = claimType.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (CLAIM_TYPES.includes(normalized as RealityClaimType)) return normalized as RealityClaimType;
  if (normalized.includes('build') && normalized.includes('complete')) return 'build_completed';
  if (normalized.includes('verif')) return 'verification_passed';
  if (normalized.includes('trust')) return 'trust_established';
  if (normalized.includes('completion')) return 'completion_verified';
  if (normalized.includes('health')) return 'project_healthy';
  if (normalized.includes('govern')) return 'governance_approved';
  return 'build_completed';
}

function resolveCategory(claimType: RealityClaimType): RealityCategory {
  if (claimType === 'build_completed' || claimType === 'completion_verified') return 'COMPLETION';
  if (claimType === 'verification_passed') return 'VERIFICATION';
  if (claimType === 'trust_established') return 'TRUST';
  if (claimType === 'governance_approved') return 'GOVERNANCE';
  if (claimType === 'project_healthy') return 'MONITORING';
  return 'GENERAL';
}

function resolveVerificationState(state?: string): RealityVerificationState {
  if (!state) return 'UNKNOWN';
  const upper = state.toUpperCase();
  const valid: RealityVerificationState[] = ['VERIFIED', 'PARTIAL', 'UNVERIFIED', 'CONFLICTED', 'UNKNOWN'];
  return valid.includes(upper as RealityVerificationState) ? (upper as RealityVerificationState) : 'UNKNOWN';
}

function indexRecord(record: RealityRecord): void {
  const add = <K>(map: Map<K, Set<string>>, key: K, id: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(id);
  };
  add(recordsBySource, record.source, record.recordId);
  add(recordsByProject, record.project, record.recordId);
  add(recordsByWorkspace, record.workspace, record.recordId);
  add(recordsByCategory, record.category, record.recordId);
  add(recordsByStatus, record.status, record.recordId);
  add(recordsByVerificationState, record.verificationState, record.recordId);
}

export function registerRealityRecord(
  input: RawRealityClaimInput,
  defaults: { project?: string; workspace?: string } = {},
): RealityRecord {
  recordCounter += 1;
  const claimType = resolveClaimType(String(input.claimType));

  const record: RealityRecord = {
    recordId: `reality-${recordCounter}`,
    source: resolveSource(input.source),
    project: input.project ?? defaults.project ?? 'default_project',
    workspace: input.workspace ?? defaults.workspace ?? 'default_workspace',
    category: resolveCategory(claimType),
    claimType,
    status: 'ACTIVE',
    verificationState: resolveVerificationState(input.verificationState),
    strength: Math.max(0, Math.min(100, Math.round(input.strength ?? 50))),
    trustLevel: Math.max(0, Math.min(100, Math.round(input.trustLevel ?? 50))),
    claim: input.claim ?? claimType,
    timestamp: input.timestamp ?? Date.now(),
  };

  recordsById.set(record.recordId, record);
  indexRecord(record);
  return record;
}

export function registerRealityRecords(
  inputs: RawRealityClaimInput[],
  defaults: { project?: string; workspace?: string } = {},
): RealityRecord[] {
  return inputs.map((input) => registerRealityRecord(input, defaults));
}

export function getRealityRecord(recordId: string): RealityRecord | undefined {
  return recordsById.get(recordId);
}

export function listRealityRecords(): RealityRecord[] {
  return [...recordsById.values()];
}

export function getRealityRecordCount(): number {
  return recordsById.size;
}

export function lookupRealityBySource(source: RealitySourceId): RealityRecord[] {
  const ids = recordsBySource.get(source);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)!).filter(Boolean);
}

export function lookupRealityByProject(project: string): RealityRecord[] {
  const ids = recordsByProject.get(project);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)!).filter(Boolean);
}

export function lookupRealityByWorkspace(workspace: string): RealityRecord[] {
  const ids = recordsByWorkspace.get(workspace);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)!).filter(Boolean);
}

export function lookupRealityByCategory(category: RealityCategory): RealityRecord[] {
  const ids = recordsByCategory.get(category);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)!).filter(Boolean);
}

export function lookupRealityByStatus(status: RealityRecordStatus): RealityRecord[] {
  const ids = recordsByStatus.get(status);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)!).filter(Boolean);
}

export function lookupRealityByVerificationState(state: RealityVerificationState): RealityRecord[] {
  const ids = recordsByVerificationState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)!).filter(Boolean);
}

export function resetRealityRecordRegistryForTests(): void {
  recordsById.clear();
  recordsBySource.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByCategory.clear();
  recordsByStatus.clear();
  recordsByVerificationState.clear();
  recordCounter = 0;
}
