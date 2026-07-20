/**
 * Production Timeline and Diagnostic Integrity Repair V1 — canonical timeline projection.
 * Extends the existing production-surface-integration path; not a new authority.
 */

import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { BuildOutcome } from '../build-context-integrity/build-context-types.js';
import { isBlockedBuildOutcome } from '../build-context-integrity/index.js';
import { resolveProductionSurfaceBuildOutcomeFromResult } from './status-surface.js';

export const PRODUCTION_TIMELINE_LIFECYCLE_STATES = [
  'NOT_STARTED',
  'RUNNING',
  'COMPLETED',
  'SKIPPED',
  'BLOCKED',
  'FAILED',
] as const;

export type ProductionTimelineLifecycleState = (typeof PRODUCTION_TIMELINE_LIFECYCLE_STATES)[number];

/** Canonical production order for user-visible timeline events. */
export const CANONICAL_PRODUCTION_TIMELINE_ORDER = [
  'INTENT',
  'PLANNING',
  'ARCHITECTURE',
  'UNIVERSAL_FEATURE_CONTRACT',
  'CBGA',
  'GPCA',
  'MATERIALIZATION',
  'RUNTIME',
  'PREVIEW',
  'INTERACTION_PROOF',
] as const;

export type CanonicalProductionTimelineStageId = (typeof CANONICAL_PRODUCTION_TIMELINE_ORDER)[number];

export interface ProductionTimelineEventOwner {
  readonly readOnly: true;
  readonly stageId: CanonicalProductionTimelineStageId;
  readonly ownerModule: string;
  readonly ownerFunction: string;
}

export interface ProductionTimelineEvent {
  readonly readOnly: true;
  readonly stageId: CanonicalProductionTimelineStageId;
  readonly label: string;
  readonly state: ProductionTimelineLifecycleState;
  readonly detail: string;
  readonly owner: ProductionTimelineEventOwner;
  /** UI may show a green checkmark only when this is true (= COMPLETED). */
  readonly showCompletedMark: boolean;
}

export interface ProductionTimelineReport {
  readonly readOnly: true;
  readonly buildId: string;
  readonly buildOutcome: BuildOutcome;
  readonly blockingStageId: CanonicalProductionTimelineStageId | null;
  readonly events: readonly ProductionTimelineEvent[];
  readonly writers: readonly ProductionTimelineEventOwner[];
  readonly duplicateWritersRejected: boolean;
  readonly impossibleCompletedStatesRejected: boolean;
}

const STAGE_LABELS: Record<CanonicalProductionTimelineStageId, string> = {
  INTENT: 'Intent understood',
  PLANNING: 'Planning complete',
  ARCHITECTURE: 'Architecture complete',
  UNIVERSAL_FEATURE_CONTRACT: 'Universal Feature Contract generated',
  CBGA: 'Contract-Bound Generation Authority',
  GPCA: 'Generation compliance validation',
  MATERIALIZATION: 'Modules generated / Workspace materialized',
  RUNTIME: 'Runtime started',
  PREVIEW: 'Live Preview ready',
  INTERACTION_PROOF: 'Interaction proof',
};

const STAGE_OWNERS: Record<
  CanonicalProductionTimelineStageId,
  { readonly ownerModule: string; readonly ownerFunction: string }
> = {
  INTENT: {
    ownerModule: 'src/chat-to-build-execution-bridge-v1/bridge-authority.ts',
    ownerFunction: 'executeChatToBuildBridge',
  },
  PLANNING: {
    ownerModule: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    ownerFunction: 'runOnePromptLivePreviewBuild',
  },
  ARCHITECTURE: {
    ownerModule: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    ownerFunction: 'runOnePromptLivePreviewBuild',
  },
  UNIVERSAL_FEATURE_CONTRACT: {
    ownerModule: 'src/contract-bound-generation-authority-v4',
    ownerFunction: 'applyContractBoundGenerationToBuildPlan',
  },
  CBGA: {
    ownerModule: 'src/contract-bound-generation-authority-v4',
    ownerFunction: 'applyContractBoundGenerationToBuildPlan',
  },
  GPCA: {
    ownerModule: 'src/generation-pipeline-compliance-authority-v1',
    ownerFunction: 'runGenerationPipelineComplianceGate',
  },
  MATERIALIZATION: {
    ownerModule: 'src/universal-prompt-to-app-materialization',
    ownerFunction: 'materializeGeneratedApplication',
  },
  RUNTIME: {
    ownerModule: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    ownerFunction: 'startGeneratedAppDevServer',
  },
  PREVIEW: {
    ownerModule: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    ownerFunction: 'runOnePromptLivePreviewBuild',
  },
  INTERACTION_PROOF: {
    ownerModule: 'src/live-preview-interaction-proof-v1',
    ownerFunction: 'runLivePreviewInteractionProof',
  },
};

function ownerFor(stageId: CanonicalProductionTimelineStageId): ProductionTimelineEventOwner {
  const owner = STAGE_OWNERS[stageId];
  return { readOnly: true, stageId, ownerModule: owner.ownerModule, ownerFunction: owner.ownerFunction };
}

function gpcaBlocked(build: OnePromptLivePreviewBuildResult): boolean {
  return (
    build.gpcaHardStop === true ||
    build.gpcaBlockedMaterialization === true ||
    build.gpcaBlockedPreviewActivation === true
  );
}

function completedUpTo(
  stageId: CanonicalProductionTimelineStageId,
  blockAt: CanonicalProductionTimelineStageId | null,
  failedAt: CanonicalProductionTimelineStageId | null,
): ProductionTimelineLifecycleState {
  const order = CANONICAL_PRODUCTION_TIMELINE_ORDER;
  const index = order.indexOf(stageId);
  if (blockAt) {
    const blockIndex = order.indexOf(blockAt);
    if (index < blockIndex) return 'COMPLETED';
    if (index === blockIndex) return 'BLOCKED';
    return 'SKIPPED';
  }
  if (failedAt) {
    const failIndex = order.indexOf(failedAt);
    if (index < failIndex) return 'COMPLETED';
    if (index === failIndex) return 'FAILED';
    return 'SKIPPED';
  }
  return 'COMPLETED';
}

/**
 * Projects the only timeline allowed into the browser response from canonical BuildOutcome
 * and observed GPCA/runtime flags — never from optimistic bridge progress items.
 */
export function projectCanonicalProductionTimeline(
  build: OnePromptLivePreviewBuildResult,
): ProductionTimelineReport {
  const buildOutcome = resolveProductionSurfaceBuildOutcomeFromResult(build);
  const blocked = isBlockedBuildOutcome(buildOutcome);
  const gpca = gpcaBlocked(build);

  let blockingStageId: CanonicalProductionTimelineStageId | null = null;
  let failedAt: CanonicalProductionTimelineStageId | null = null;

  if (gpca || buildOutcome === 'BUILD_BLOCKED_GPCA') {
    blockingStageId = 'GPCA';
  } else if (blocked) {
    failedAt = 'PREVIEW';
  }

  const writers = CANONICAL_PRODUCTION_TIMELINE_ORDER.map(ownerFor);
  const writerKeys = new Set(writers.map((w) => `${w.stageId}::${w.ownerModule}::${w.ownerFunction}`));
  const duplicateWritersRejected = writerKeys.size === writers.length;

  const events: ProductionTimelineEvent[] = CANONICAL_PRODUCTION_TIMELINE_ORDER.map((stageId) => {
    const state = completedUpTo(stageId, blockingStageId, failedAt);
    const detail =
      state === 'BLOCKED'
        ? build.failureReason ?? 'Generation pipeline compliance blocked this build.'
        : state === 'SKIPPED'
          ? `Skipped because execution stopped at ${blockingStageId ?? failedAt}.`
          : state === 'FAILED'
            ? build.failureReason ?? 'Stage failed.'
            : `${STAGE_LABELS[stageId]} finished.`;
    return {
      readOnly: true as const,
      stageId,
      label: STAGE_LABELS[stageId],
      state,
      detail,
      owner: ownerFor(stageId),
      showCompletedMark: state === 'COMPLETED',
    };
  });

  const impossibleCompletedStatesRejected = !(
    blocked &&
    events.some(
      (event) =>
        (event.stageId === 'RUNTIME' ||
          event.stageId === 'PREVIEW' ||
          event.stageId === 'MATERIALIZATION' ||
          event.stageId === 'INTERACTION_PROOF') &&
        event.state === 'COMPLETED',
    )
  );

  return {
    readOnly: true,
    buildId: build.buildId,
    buildOutcome,
    blockingStageId,
    events,
    writers,
    duplicateWritersRejected,
    impossibleCompletedStatesRejected,
  };
}

export function timelineHasNoImpossibleCompletedStates(report: ProductionTimelineReport): boolean {
  if (!isBlockedBuildOutcome(report.buildOutcome)) return true;
  const blockIndex = report.blockingStageId
    ? CANONICAL_PRODUCTION_TIMELINE_ORDER.indexOf(report.blockingStageId)
    : -1;
  return report.events.every((event) => {
    const index = CANONICAL_PRODUCTION_TIMELINE_ORDER.indexOf(event.stageId);
    if (blockIndex >= 0 && index > blockIndex) {
      return event.state === 'SKIPPED' || event.state === 'BLOCKED' || event.state === 'NOT_STARTED';
    }
    if (event.stageId === report.blockingStageId) {
      return event.state === 'BLOCKED' || event.state === 'FAILED';
    }
    return true;
  });
}

export function timelineEveryEventHasExactlyOneOwner(report: ProductionTimelineReport): boolean {
  const seen = new Set<string>();
  for (const event of report.events) {
    if (seen.has(event.stageId)) return false;
    seen.add(event.stageId);
  }
  return report.duplicateWritersRejected && seen.size === report.events.length;
}

/** Maps canonical lifecycle → builder-home work-log status class. */
export function mapTimelineStateToWorkLogStatus(
  state: ProductionTimelineLifecycleState,
): 'complete' | 'failed' | 'active' | 'pending' | 'skipped' | 'blocked' {
  switch (state) {
    case 'COMPLETED':
      return 'complete';
    case 'FAILED':
      return 'failed';
    case 'BLOCKED':
      return 'blocked';
    case 'RUNNING':
      return 'active';
    case 'SKIPPED':
      return 'skipped';
    default:
      return 'pending';
  }
}
