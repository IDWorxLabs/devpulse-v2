/**
 * DevPulse V2 Evidence Registry Authority — single source of truth for proof references.
 * Does NOT score trust, make decisions, or execute work.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { TRUST_OWNER_MODULE } from '../trust-engine/types.js';
import { formatEvidenceRegistryReport } from './evidence-registry-report.js';
import type {
  EvidenceRecord,
  EvidenceRecordInput,
  EvidenceRegistryState,
  EvidenceSnapshot,
  EvidenceSource,
} from './types.js';
import { REGISTRY_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2EvidenceRegistryAuthority | null = null;

function createEvidenceId(): string {
  return `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSnapshotId(): string {
  return `ev-snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneRecord(record: EvidenceRecord): EvidenceRecord {
  return {
    ...record,
    tags: [...record.tags],
    warnings: [...record.warnings],
    errors: [...record.errors],
  };
}

export class DevPulseV2EvidenceRegistryAuthority {
  private readonly records = new Map<string, EvidenceRecord>();
  private readonly snapshots: EvidenceSnapshot[] = [];
  private registryWarnings: string[] = [];
  private registryErrors: string[] = [];

  static readonly ownerModule = REGISTRY_OWNER_MODULE;
  static readonly ownerDomain = 'evidence_registry' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('evidence_registry');
    return owner.ownerModule === REGISTRY_OWNER_MODULE;
  }

  static assertDoesNotReplaceTrustEngine(): boolean {
    return getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE;
  }

  static assertDoesNotReplaceProjectVault(): boolean {
    return getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE;
  }

  addEvidence(input: EvidenceRecordInput): EvidenceRecord {
    const record: EvidenceRecord = {
      evidenceId: input.evidenceId ?? createEvidenceId(),
      createdAt: input.createdAt ?? Date.now(),
      source: input.source,
      label: input.label.trim(),
      summary: input.summary.trim(),
      status: input.status,
      relatedSystemId: input.relatedSystemId,
      relatedRecordId: input.relatedRecordId,
      tags: [...input.tags],
      warnings: [...input.warnings],
      errors: [...input.errors],
    };

    if (!record.label) {
      record.errors.push('Evidence label is required');
      this.registryErrors.push('addEvidence rejected empty label');
    } else {
      this.records.set(record.evidenceId, record);
    }

    return cloneRecord(record);
  }

  getEvidence(evidenceId: string): EvidenceRecord | null {
    const record = this.records.get(evidenceId);
    return record ? cloneRecord(record) : null;
  }

  listEvidence(): EvidenceRecord[] {
    return [...this.records.values()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(cloneRecord);
  }

  listEvidenceBySource(source: EvidenceSource): EvidenceRecord[] {
    return this.listEvidence().filter((r) => r.source === source);
  }

  listEvidenceBySystem(systemId: string): EvidenceRecord[] {
    return this.listEvidence().filter((r) => r.relatedSystemId === systemId);
  }

  createEvidenceSnapshot(): EvidenceSnapshot {
    const records = this.listEvidence();
    const snapshot: EvidenceSnapshot = {
      snapshotId: createSnapshotId(),
      capturedAt: Date.now(),
      evidenceCount: records.length,
      records,
    };
    this.snapshots.push(snapshot);
    return {
      ...snapshot,
      records: snapshot.records.map(cloneRecord),
    };
  }

  getRegistryState(): EvidenceRegistryState {
    const records = this.listEvidence();
    const sourceCounts: Partial<Record<EvidenceSource, number>> = {};

    for (const record of records) {
      sourceCounts[record.source] = (sourceCounts[record.source] ?? 0) + 1;
    }

    return {
      ownerModule: REGISTRY_OWNER_MODULE,
      evidenceCount: records.length,
      snapshotCount: this.snapshots.length,
      sourceCounts,
      warnCount: records.filter((r) => r.status === 'WARN').length,
      failCount: records.filter((r) => r.status === 'FAIL').length,
      latestEvidenceId: records[0]?.evidenceId ?? null,
      warnings: [...this.registryWarnings],
      errors: [...this.registryErrors],
    };
  }

  formatReport(): string {
    const state = this.getRegistryState();
    const latest =
      state.latestEvidenceId !== null
        ? this.getEvidence(state.latestEvidenceId)
        : null;
    return formatEvidenceRegistryReport(state, latest);
  }
}

export function createDevPulseV2EvidenceRegistryAuthority(): DevPulseV2EvidenceRegistryAuthority {
  singleton = new DevPulseV2EvidenceRegistryAuthority();
  return singleton;
}

export function getDevPulseV2EvidenceRegistryAuthority(): DevPulseV2EvidenceRegistryAuthority {
  if (!singleton) {
    singleton = new DevPulseV2EvidenceRegistryAuthority();
  }
  return singleton;
}

export function resetDevPulseV2EvidenceRegistryAuthorityForTests(): DevPulseV2EvidenceRegistryAuthority {
  singleton = new DevPulseV2EvidenceRegistryAuthority();
  return singleton;
}
