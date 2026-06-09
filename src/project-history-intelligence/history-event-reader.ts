/**
 * History event reader — seeds and reads project evolution events (read-only).
 */

import { bridgeVaultFactsIntoUnderstanding } from '../project-vault-intelligence/project-vault-understanding-bridge.js';
import { getWorkspaceSnapshot } from '../workspace-intelligence/index.js';
import { getTimelineEvents } from '../timeline-intelligence/timeline-event-store.js';
import type { HistoryEvent, HistoryCheckpoint } from './project-history-intelligence-types.js';

const BASE_TS = 1_710_000_000_000;
let eventCounter = 0;

function nextEventId(): string {
  eventCounter += 1;
  return `hist-evt-${eventCounter.toString().padStart(4, '0')}`;
}

function hist(
  offset: number,
  phase: string,
  changeType: HistoryEvent['changeType'],
  source: string,
  summary: string,
  opts: Partial<Pick<HistoryEvent, 'checkpointReference' | 'rollbackReference' | 'reason' | 'workspaceId'>> = {},
): HistoryEvent {
  return {
    eventId: nextEventId(),
    timestamp: BASE_TS + offset,
    phase,
    changeType,
    source,
    summary,
    confidence: 'HIGH',
    checkpointReference: opts.checkpointReference ?? null,
    rollbackReference: opts.rollbackReference ?? null,
    reason: opts.reason ?? summary,
    workspaceId: opts.workspaceId ?? 'ws-devpulse-v2-primary',
    readOnly: true,
  };
}

const SEED_EVENTS: Array<Omit<HistoryEvent, 'eventId' | 'readOnly'>> = [
  {
    timestamp: BASE_TS,
    phase: '11.1',
    changeType: 'CAPABILITY_ADDED',
    source: 'command_center_brain',
    summary: 'Unified Command Center Brain foundation established.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_COMMAND_CENTER_BRAIN_FOUNDATION_V1_PASS',
    rollbackReference: null,
    reason: 'Phase 11.1 introduced local intelligence orchestration without execution.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 1_000_000,
    phase: '11.2',
    changeType: 'CAPABILITY_ADDED',
    source: 'cross_system_awareness',
    summary: 'Cross-System Awareness added relationship explanations.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_CROSS_SYSTEM_AWARENESS_FOUNDATION_V1_PASS',
    rollbackReference: null,
    reason: 'Phase 11.2 enabled dependency/impact awareness without execution.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 2_000_000,
    phase: '11.3',
    changeType: 'CAPABILITY_ADDED',
    source: 'shared_memory_layer',
    summary: 'Shared Memory Layer introduced in-memory structured recall.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_SHARED_MEMORY_LAYER_FOUNDATION_V1_PASS',
    rollbackReference: null,
    reason: 'Phase 11.3 added DevPulse memory without persistence or file writes.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 3_000_000,
    phase: '11.4',
    changeType: 'CAPABILITY_ADDED',
    source: 'project_understanding_engine',
    summary: 'Project Understanding Engine and General Question Router established.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_PROJECT_UNDERSTANDING_ENGINE_FOUNDATION_V1_PASS',
    rollbackReference: null,
    reason: 'Phase 11.4 owns project comprehension — no duplicate brain.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 4_000_000,
    phase: '11.5',
    changeType: 'CAPABILITY_ADDED',
    source: 'timeline_intelligence',
    summary: 'Timeline Intelligence introduced past/present/future phase understanding.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_TIMELINE_INTELLIGENCE_FOUNDATION_V1_PASS',
    rollbackReference: null,
    reason: 'Phase 11.5 owns timeline phase status — Project History supplements evolution events.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 5_000_000,
    phase: '11.6',
    changeType: 'CAPABILITY_ADDED',
    source: 'unified_decision_layer',
    summary: 'Unified Decision Layer added advisory build/defer/block recommendations.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_UNIFIED_DECISION_LAYER_FOUNDATION_V1_PASS',
    rollbackReference: null,
    reason: 'Phase 11.6 provides decision intelligence without execution.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 6_000_000,
    phase: '11',
    changeType: 'CHECKPOINT_PASSED',
    source: 'command_center_brain',
    summary: 'Phase 11 Command Center stack verification passed.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_PHASE11_COMMAND_CENTER_VERIFICATION_PASS',
    rollbackReference: null,
    reason: 'Full Phase 11 intelligence stack validated.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 7_000_000,
    phase: '12.1',
    changeType: 'INTEGRATION',
    source: 'project_vault_intelligence',
    summary: 'Project Vault Intelligence bridge connected vault facts into Project Understanding.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_PROJECT_VAULT_INTELLIGENCE_FOUNDATION_V1_PASS',
    rollbackReference: null,
    reason: 'Phase 12.1 read-only vault bridge — no duplicate PU engine.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 8_000_000,
    phase: '12.2',
    changeType: 'CAPABILITY_ADDED',
    source: 'dependency_intelligence',
    summary: 'Dependency Intelligence introduced system/capability relationship awareness.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_DEPENDENCY_INTELLIGENCE_FOUNDATION_V1_PASS',
    rollbackReference: null,
    reason: 'Phase 12.2 models upstream/downstream dependencies for advisory reasoning.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 9_000_000,
    phase: '12.3',
    changeType: 'CAPABILITY_ADDED',
    source: 'workspace_intelligence',
    summary: 'Workspace Intelligence introduced workspace ownership and isolation awareness.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_WORKSPACE_INTELLIGENCE_FOUNDATION_V1_PASS',
    rollbackReference: null,
    reason: 'Phase 12.3 tracks active workspace/project boundaries without execution.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 9_500_000,
    phase: '12',
    changeType: 'ROLLBACK',
    source: 'execution_runtime',
    summary: 'Premature execution runtime attempt rolled back — intelligence layers incomplete.',
    confidence: 'HIGH',
    checkpointReference: null,
    rollbackReference: 'rollback-execution-defer-001',
    reason: 'Execution must not start until intelligence foundations complete.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 9_600_000,
    phase: '12',
    changeType: 'RESTORE',
    source: 'command_center_brain',
    summary: 'Command Center intelligence-only path restored after execution deferral.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_PHASE11_COMMAND_CENTER_VERIFICATION_PASS',
    rollbackReference: 'rollback-execution-defer-001',
    reason: 'Intelligence stack restored as safe advisory path.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
  {
    timestamp: BASE_TS + 10_000_000,
    phase: '12.4',
    changeType: 'CAPABILITY_ADDED',
    source: 'project_history_intelligence',
    summary: 'Project History Intelligence introduced evolution and checkpoint awareness.',
    confidence: 'HIGH',
    checkpointReference: 'DEVPULSE_V2_PROJECT_HISTORY_INTELLIGENCE_FOUNDATION_V1_PASS',
    rollbackReference: null,
    reason: 'Phase 12.4 tracks what changed, when, and why — Timeline Intelligence unchanged.',
    workspaceId: 'ws-devpulse-v2-primary',
  },
];

const SEED_CHECKPOINTS: HistoryCheckpoint[] = [
  { checkpointId: 'cp-11-verify', passToken: 'DEVPULSE_V2_PHASE11_COMMAND_CENTER_VERIFICATION_PASS', phase: '11', capability: 'Command Center Stack', summary: 'Phase 11 full stack verified', timestamp: BASE_TS + 6_000_000, confidence: 'HIGH', readOnly: true },
  { checkpointId: 'cp-12-1', passToken: 'DEVPULSE_V2_PROJECT_VAULT_INTELLIGENCE_FOUNDATION_V1_PASS', phase: '12.1', capability: 'Project Vault Intelligence', summary: 'Vault bridge validated', timestamp: BASE_TS + 7_000_000, confidence: 'HIGH', readOnly: true },
  { checkpointId: 'cp-12-2', passToken: 'DEVPULSE_V2_DEPENDENCY_INTELLIGENCE_FOUNDATION_V1_PASS', phase: '12.2', capability: 'Dependency Intelligence', summary: 'Dependency graph validated', timestamp: BASE_TS + 8_000_000, confidence: 'HIGH', readOnly: true },
  { checkpointId: 'cp-12-3', passToken: 'DEVPULSE_V2_WORKSPACE_INTELLIGENCE_FOUNDATION_V1_PASS', phase: '12.3', capability: 'Workspace Intelligence', summary: 'Workspace awareness validated', timestamp: BASE_TS + 9_000_000, confidence: 'HIGH', readOnly: true },
  { checkpointId: 'cp-12-4', passToken: 'DEVPULSE_V2_PROJECT_HISTORY_INTELLIGENCE_FOUNDATION_V1_PASS', phase: '12.4', capability: 'Project History Intelligence', summary: 'History intelligence validated', timestamp: BASE_TS + 10_000_000, confidence: 'HIGH', readOnly: true },
];

let cachedEvents: HistoryEvent[] | null = null;

export function readHistoryEvents(query: string): HistoryEvent[] {
  bridgeVaultFactsIntoUnderstanding(query);
  getWorkspaceSnapshot();
  const timelineEvents = getTimelineEvents();

  if (!cachedEvents) {
    cachedEvents = SEED_EVENTS.map((e) => ({ ...e, eventId: nextEventId(), readOnly: true as const }));
  }

  const vaultEvidence: HistoryEvent[] = [];
  const bridge = bridgeVaultFactsIntoUnderstanding(query);
  if (bridge.vaultFactsAdded > 0) {
    vaultEvidence.push(
      hist(10_100_000, '12.1', 'INTEGRATION', 'project_vault', `Vault evidence: ${bridge.vaultFactsAdded} facts support history context.`, {
        checkpointReference: 'DEVPULSE_V2_PROJECT_VAULT_INTELLIGENCE_FOUNDATION_V1_PASS',
        reason: 'Vault records used as read-only historical evidence.',
      }),
    );
  }

  const timelineDerived: HistoryEvent[] = timelineEvents.slice(0, 5).map((tl, i) =>
    hist(10_200_000 + i * 1000, tl.phase, 'MILESTONE', 'timeline_intelligence', tl.title, {
      reason: tl.description,
      checkpointReference: null,
    }),
  );

  return [...cachedEvents, ...vaultEvidence, ...timelineDerived];
}

export function readHistoryCheckpoints(): HistoryCheckpoint[] {
  return [...SEED_CHECKPOINTS];
}

export function resetHistoryEventReaderForTests(): HistoryEvent[] {
  eventCounter = 0;
  cachedEvents = null;
  return readHistoryEvents('reset');
}
