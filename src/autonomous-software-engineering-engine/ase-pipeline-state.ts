/**
 * ASE — unified pipeline state.
 */

import { createHash } from 'node:crypto';
import type {
  AseGateResult,
  AseOverallStatus,
  AsePipelineState,
  AseResumeBoundary,
  AseStageId,
  AseStageStatus,
} from './ase-types.js';
import { ASE_STAGE_ORDER } from './ase-types.js';

let runCounter = 0;

export function resetAsePipelineStateForTests(): void {
  runCounter = 0;
}

function nextRunId(): string {
  runCounter += 1;
  return `ase-run-${runCounter}`;
}

export function hashAsePrompt(rawPrompt: string): string {
  return createHash('sha256').update(rawPrompt.trim()).digest('hex').slice(0, 16);
}

function defaultStageStatuses(): Record<AseStageId, AseStageStatus> {
  return Object.fromEntries(ASE_STAGE_ORDER.map((s) => [s, 'PENDING'])) as Record<AseStageId, AseStageStatus>;
}

export function createAsePipelineState(input: {
  rawPrompt: string;
  projectId?: string | null;
  resumeState?: AsePipelineState | null;
  resumeFromBoundary?: AseResumeBoundary | null;
}): AsePipelineState {
  if (input.resumeState) {
    return {
      ...input.resumeState,
      overallStatus: 'RUNNING',
      resumePoint: input.resumeFromBoundary ?? input.resumeState.resumePoint,
    };
  }

  return {
    readOnly: true,
    runId: nextRunId(),
    projectId: input.projectId ?? null,
    promptHash: hashAsePrompt(input.rawPrompt),
    currentStage: 'INTENT_UNDERSTANDING',
    currentGate: 'INTENT_UNDERSTANDING',
    overallStatus: 'RUNNING',
    stageStatuses: defaultStageStatuses(),
    gateResults: [],
    evidenceReferences: [],
    repairLoops: 0,
    capabilityEvolutionLoops: 0,
    improvementLoops: 0,
    launchVerdict: null,
    livePreviewState: null,
    resumePoint: input.resumeFromBoundary ?? null,
  };
}

export function updateAsePipelineState(
  state: AsePipelineState,
  patch: Partial<
    Pick<
      AsePipelineState,
      | 'currentStage'
      | 'currentGate'
      | 'overallStatus'
      | 'stageStatuses'
      | 'gateResults'
      | 'evidenceReferences'
      | 'repairLoops'
      | 'capabilityEvolutionLoops'
      | 'improvementLoops'
      | 'launchVerdict'
      | 'livePreviewState'
      | 'resumePoint'
    >
  >,
): AsePipelineState {
  return {
    ...state,
    ...patch,
    stageStatuses: patch.stageStatuses ?? state.stageStatuses,
    gateResults: patch.gateResults ?? state.gateResults,
    evidenceReferences: patch.evidenceReferences ?? state.evidenceReferences,
  };
}

export function markAseStageStatus(
  stageStatuses: Readonly<Record<AseStageId, AseStageStatus>>,
  stageId: AseStageId,
  status: AseStageStatus,
): Record<AseStageId, AseStageStatus> {
  return { ...stageStatuses, [stageId]: status };
}

export function deriveAseOverallStatus(input: {
  launchReady: boolean;
  previewUnlocked: boolean;
  humanReview: boolean;
  blocked: boolean;
  repairing: boolean;
  evolving: boolean;
  improving: boolean;
}): AseOverallStatus {
  if (input.previewUnlocked) return 'PREVIEW_UNLOCKED';
  if (input.launchReady) return 'LAUNCH_READY';
  if (input.humanReview) return 'HUMAN_REVIEW_REQUIRED';
  if (input.repairing) return 'REPAIRING';
  if (input.evolving) return 'EVOLVING_CAPABILITY';
  if (input.improving) return 'IMPROVING';
  if (input.blocked) return 'BLOCKED';
  return 'PASSED';
}

export function finalizeAseGateResults(gateResults: readonly AseGateResult[]): readonly AseGateResult[] {
  return gateResults;
}
