/**
 * Read-only adapters — Central Brain observes source authorities without mutation.
 */

import { getDevPulseV2EvidenceRegistryAuthority } from '../evidence-registry/evidence-registry-authority.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import { TRUST_OWNER_MODULE } from '../trust-engine/types.js';
import type { BrainSystemStatus, BrainSystemSummary, ObservedSystemId } from './types.js';

function mapPassWarnFail(
  pass: boolean,
  warn: boolean,
  fail: boolean,
): BrainSystemStatus {
  if (fail) return 'FAIL';
  if (warn) return 'WARN';
  if (pass) return 'READY';
  return 'UNKNOWN';
}

export function readTrustEngineSummary(): BrainSystemSummary {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  const now = Date.now();

  if (!result) {
    return {
      systemId: 'trust_engine',
      owner: TRUST_OWNER_MODULE,
      status: 'UNKNOWN',
      summary: 'No trust evaluation available — Trust Engine has not been observed yet.',
      lastUpdatedAt: now,
    };
  }

  const status: BrainSystemStatus =
    result.status === 'PASS' ? 'READY' : result.status === 'WARN' ? 'WARN' : 'FAIL';

  return {
    systemId: 'trust_engine',
    owner: TRUST_OWNER_MODULE,
    status,
    summary: `Trust observation: status=${result.status}; score=${result.trustScore}; checks=${result.checks.length}`,
    lastUpdatedAt: result.createdAt,
  };
}

export function readProjectVaultSummary(): BrainSystemSummary {
  const state = getDevPulseV2ProjectVaultAuthority().getVaultState();
  const status = mapPassWarnFail(
    state.errors.length === 0 && state.warnings.length === 0,
    state.errors.length === 0 && state.warnings.length > 0,
    state.errors.length > 0,
  );

  return {
    systemId: 'project_vault',
    owner: VAULT_OWNER_MODULE,
    status,
    summary: `Vault: ${state.projectCount} projects; ${state.factCount} facts; ${state.snapshotCount} snapshots`,
    lastUpdatedAt: Date.now(),
  };
}

export function readEvidenceRegistrySummary(): BrainSystemSummary {
  const state = getDevPulseV2EvidenceRegistryAuthority().getRegistryState();
  const status = mapPassWarnFail(
    state.errors.length === 0 && state.failCount === 0 && state.warnings.length === 0,
    state.errors.length === 0 && state.failCount === 0 && (state.warnings.length > 0 || state.warnCount > 0),
    state.errors.length > 0 || state.failCount > 0,
  );

  return {
    systemId: 'evidence_registry',
    owner: REGISTRY_OWNER_MODULE,
    status,
    summary: `Evidence: ${state.evidenceCount} records; ${state.snapshotCount} snapshots; warn=${state.warnCount}; fail=${state.failCount}`,
    lastUpdatedAt: Date.now(),
  };
}

export function readTimelineLedgerSummary(): BrainSystemSummary {
  const state = getDevPulseV2TimelineLedgerAuthority().getLedgerState();
  const status = mapPassWarnFail(
    state.errors.length === 0 && state.warnings.length === 0,
    state.errors.length === 0 && state.warnings.length > 0,
    state.errors.length > 0,
  );

  return {
    systemId: 'timeline_event_ledger',
    owner: LEDGER_OWNER_MODULE,
    status,
    summary: `Timeline: ${state.eventCount} events; ${state.snapshotCount} snapshots`,
    lastUpdatedAt: Date.now(),
  };
}

const ADAPTERS: Record<ObservedSystemId, () => BrainSystemSummary> = {
  trust_engine: readTrustEngineSummary,
  project_vault: readProjectVaultSummary,
  evidence_registry: readEvidenceRegistrySummary,
  timeline_event_ledger: readTimelineLedgerSummary,
};

export function readSystemSummary(systemId: ObservedSystemId): BrainSystemSummary {
  return ADAPTERS[systemId]();
}

export function readAllSystemSummaries(): BrainSystemSummary[] {
  return [
    readTrustEngineSummary(),
    readProjectVaultSummary(),
    readEvidenceRegistrySummary(),
    readTimelineLedgerSummary(),
  ];
}
