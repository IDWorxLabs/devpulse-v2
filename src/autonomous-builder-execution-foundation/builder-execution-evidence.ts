/**
 * Builder execution evidence — mandatory proof for actions (Phase 24B).
 */

import { MAX_EXECUTION_EVIDENCE } from './autonomous-builder-execution-foundation-bounds.js';

export type BuilderEvidenceType =
  | 'FILE_CREATED'
  | 'FILE_MODIFIED'
  | 'BUILD_STARTED'
  | 'BUILD_COMPLETED'
  | 'BUILD_FAILED'
  | 'COMMAND_EXECUTED'
  | 'OUTPUT_GENERATED'
  | 'RUNTIME_STARTED'
  | 'WORKSPACE_CREATED'
  | 'EXECUTION_PLAN_GENERATED'
  | 'ACTION_QUEUED';

/** Future mobile runtime extension points — not implemented in 24B. */
export const FUTURE_MOBILE_RUNTIME_EVIDENCE_TYPES = [
  'ANDROID_RUNTIME_STARTED',
  'IOS_RUNTIME_STARTED',
  'EXPO_RUNTIME_STARTED',
  'ANDROID_DEVICE_PREVIEW',
  'IOS_DEVICE_PREVIEW',
  'TESTFLIGHT_RUNTIME',
] as const;

export type FutureMobileRuntimeEvidenceType = (typeof FUTURE_MOBILE_RUNTIME_EVIDENCE_TYPES)[number];

export interface BuilderExecutionEvidenceRecord {
  evidenceId: string;
  workspaceId: string;
  actionId: string | null;
  evidenceType: BuilderEvidenceType | FutureMobileRuntimeEvidenceType;
  description: string;
  source: string;
  recordedAt: number;
}

const evidenceRecords: BuilderExecutionEvidenceRecord[] = [];
let evidenceCounter = 0;

export function resetBuilderExecutionEvidenceForTests(): void {
  evidenceRecords.length = 0;
  evidenceCounter = 0;
}

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `builder-evidence-${evidenceCounter}`;
}

export function recordBuilderExecutionEvidence(input: {
  workspaceId: string;
  actionId?: string | null;
  evidenceType: BuilderEvidenceType | FutureMobileRuntimeEvidenceType;
  description: string;
  source: string;
}): BuilderExecutionEvidenceRecord {
  const record: BuilderExecutionEvidenceRecord = {
    evidenceId: nextEvidenceId(),
    workspaceId: input.workspaceId,
    actionId: input.actionId ?? null,
    evidenceType: input.evidenceType,
    description: input.description,
    source: input.source,
    recordedAt: Date.now(),
  };
  evidenceRecords.unshift(record);
  if (evidenceRecords.length > MAX_EXECUTION_EVIDENCE) {
    evidenceRecords.length = MAX_EXECUTION_EVIDENCE;
  }
  return record;
}

export function listBuilderExecutionEvidence(workspaceId?: string): BuilderExecutionEvidenceRecord[] {
  if (!workspaceId) return [...evidenceRecords];
  return evidenceRecords.filter((e) => e.workspaceId === workspaceId);
}

export function getBuilderExecutionEvidenceCount(workspaceId?: string): number {
  return listBuilderExecutionEvidence(workspaceId).length;
}

export function actionSuccessRequiresEvidence(success: boolean, evidenceIds: string[]): void {
  if (success && evidenceIds.length === 0) {
    throw new Error('No action may be marked successful without evidence');
  }
}
