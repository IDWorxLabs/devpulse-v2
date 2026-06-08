/**
 * Execution Authority bridge — consumes Phase 6.1 authority; does not duplicate it.
 */

import {
  getDevPulseV2ExecutionAuthority,
  assertCentralBrainOwnershipUnchanged as assertBrainUnchangedFromAuthority,
} from '../execution-authority/index.js';
import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import type { ExecutionDecision } from '../execution-authority/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import type { ExecutionPackage, RuntimeRecord } from './types.js';
import { RUNTIME_OWNER_MODULE } from './types.js';

export function checkPackageWithExecutionAuthority(pkg: ExecutionPackage): ExecutionDecision {
  const authority = getDevPulseV2ExecutionAuthority();
  return authority.evaluateRequest({
    requestedBySystemId: pkg.requestedBy,
    requestText: pkg.requestText,
  });
}

export function assertExecutionAuthorityOwnershipUnchanged(): boolean {
  const owner = getDevPulseV2Owner('execution_authority');
  return owner.ownerModule === EXECUTION_OWNER_MODULE;
}

export function assertRuntimeDoesNotDuplicateExecutionAuthority(): boolean {
  const executionOwner = getDevPulseV2Owner('execution_authority');
  const runtimeOwner = getDevPulseV2Owner('execution_package_runtime');
  return (
    runtimeOwner.ownerModule === RUNTIME_OWNER_MODULE &&
    executionOwner.ownerModule === EXECUTION_OWNER_MODULE &&
    runtimeOwner.domain !== executionOwner.domain
  );
}

export function publishRuntimeSummary(record: RuntimeRecord): string {
  void assertBrainUnchangedFromAuthority();
  return (
    `Runtime package ${record.packageId}: ${record.runtimeDecision.finalState} — ` +
    `${record.runtimeDecision.noExecutionConfirmed ? 'no execution occurred' : 'pending'}`
  );
}

export function recordRuntimeDecisionTimelineEvent(record: RuntimeRecord): string | null {
  const ledger = getDevPulseV2TimelineLedgerAuthority();
  const event = ledger.addEvent({
    source: 'FOUNDATION',
    category: 'SYSTEM',
    title: `Execution runtime: ${record.runtimeDecision.finalState}`,
    summary: `Package ${record.packageId} — governance record only, no execution occurred.`,
    relatedEvidenceIds: [],
    relatedRecordId: record.recordId,
    status: record.runtimeDecision.accepted ? 'INFO' : 'WARN',
    warnings: [
      ...record.warnings,
      'Runtime decision recorded — no command, write, or recovery executed.',
    ],
    errors: [...record.errors],
  });
  return event.eventId;
}

export function assertTimelineLedgerOwnershipUnchanged(): boolean {
  const owner = getDevPulseV2Owner('timeline_event_ledger');
  return owner.ownerModule === LEDGER_OWNER_MODULE;
}

export function assertCentralBrainOwnershipUnchanged(): boolean {
  return assertBrainUnchangedFromAuthority();
}
