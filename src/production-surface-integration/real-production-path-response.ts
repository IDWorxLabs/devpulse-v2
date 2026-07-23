/**
 * Real Production Path Integration Repair V1 — final HTTP response projection for the browser
 * build endpoint. Wires existing canonical authorities onto the real `/api/build/from-prompt`
 * response without introducing a parallel status system.
 *
 * Production Timeline and Diagnostic Integrity Repair V1 — timeline, diagnostics, and Product
 * Faithfulness explanations are projected from the same BuildOutcome in this envelope.
 */

import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { BuildExecutionReport } from '../build-execution-stabilizer-v1/build-execution-types.js';
import type { GenerationFaithfulnessReport } from '../product-faithfulness-v2/generation-faithfulness-types.js';
import type { NormalizedBuildResult } from '../build-result-normalizer-v1/build-result-normalizer-types.js';
import type { BuildOutcome } from '../build-context-integrity/build-context-types.js';
import { createProductionBuildContext, isBlockedBuildOutcome } from '../build-context-integrity/index.js';
import { buildCanonicalProductContract } from '../product-faithfulness-v2/index.js';
import { runContractToModuleTraceabilityEvaluation } from '../contract-to-module-traceability/contract-to-module-traceability-authority.js';
import { resolveUniversalFeatureNamesForCurrentBuild } from '../contract-to-module-traceability/feature-contract-surface-resolver.js';
import {
  buildCanonicalProductFaithfulnessFindings,
} from './product-faithfulness-surface.js';
import {
  projectProductionSurfaceStatus,
  resolveProductionSurfaceBuildOutcomeFromResult,
} from './status-surface.js';
import {
  mapTimelineStateToWorkLogStatus,
  projectCanonicalProductionTimeline,
  type ProductionTimelineReport,
} from './production-timeline-integrity.js';
import {
  emitTimelineDiagnosticWorkspaceArtifacts,
  projectProductionDiagnosticReport,
  projectProductionRootCauseReport,
  type ProductionDiagnosticReport,
  type ProductionRootCauseReport,
} from './production-diagnostic-integrity.js';

export const BUILD_FROM_PROMPT_PRODUCTION_PATH = '/api/build/from-prompt' as const;
export const BUILDER_HOME_BUILD_HANDLER = 'public/founder-reality/builder-home.js :: runBuild()' as const;

export interface ProductionPathObservabilityCheckpoint {
  readonly readOnly: true;
  readonly buildRequestId: string;
  readonly buildContextId: string | null;
  readonly approvedProductIdentity: string | null;
  readonly approvedNavigationIds: readonly string[];
  readonly finalGeneratorNavigationInputs: readonly string[];
  readonly gpcaPreGenerationBlocked: boolean;
  readonly buildOutcome: string;
  readonly responseProjectTitle: string;
  readonly previewAvailable: boolean;
  readonly executionStatus: string;
}

export interface CanonicalRootCauseFaithfulnessEntry {
  readonly readOnly: true;
  readonly concept: string;
  readonly firstBrokenBoundary: string;
  readonly outcome: string;
  readonly repairEligibility: string;
  readonly regenerationStage: string | null;
  readonly requiredAction: string;
}

export interface ProductionPathProgressItem {
  readonly readOnly: true;
  readonly label: string;
  readonly status: 'pending' | 'active' | 'complete' | 'failed' | 'skipped' | 'blocked';
  readonly detail: string;
  readonly stageId: string;
}

export interface RealProductionPathResponseEnvelope {
  readonly readOnly: true;
  readonly productionPath: {
    readonly browserHandler: typeof BUILDER_HOME_BUILD_HANDLER;
    readonly apiEndpoint: typeof BUILD_FROM_PROMPT_PRODUCTION_PATH;
    readonly serverHandler: 'server/build-from-prompt-handler.ts :: handleBuildFromPromptRequest';
    readonly orchestratorEntry: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts :: runOnePromptLivePreviewBuild';
    readonly responseSerializer: 'server/build-from-prompt-handler.ts :: sendBuildJson + buildRealProductionPathResponseEnvelope';
    readonly clientStateApplier: 'public/founder-reality/builder-home.js :: applyBuildPayload';
  };
  readonly buildRequestId: string;
  readonly buildOutcome: string;
  readonly buildStatus: 'READY' | 'FAILED' | 'BUILDING';
  readonly executionStatus: string;
  readonly completionMessage: string;
  readonly currentStage: string;
  readonly heartbeat: string;
  readonly nextStep: string;
  readonly previewAvailable: boolean;
  readonly runtimeStarted: boolean;
  readonly livePreviewReady: boolean;
  readonly projectTitle: string;
  readonly buildContextId: string | null;
  readonly canonicalRootCauseFindings: readonly CanonicalRootCauseFaithfulnessEntry[];
  readonly timeline: ProductionTimelineReport;
  readonly diagnostics: ProductionDiagnosticReport;
  readonly rootCauseReport: ProductionRootCauseReport;
  readonly progressItems: readonly ProductionPathProgressItem[];
  readonly workspaceArtifacts: readonly { relativePath: string; content: string }[];
  readonly observability: ProductionPathObservabilityCheckpoint;
}

export function resolveCanonicalProjectTitleForResponse(build: OnePromptLivePreviewBuildResult): string {
  const approved = build.approvedProductIdentity?.displayName?.trim();
  if (approved) return approved;
  return build.projectName?.trim() || 'Identity resolution failed — approved product identity missing.';
}

function canonicalRootCauseFindingsFromBuild(
  build: OnePromptLivePreviewBuildResult,
): CanonicalRootCauseFaithfulnessEntry[] {
  const envelope = build.approvedProductionBuildEnvelope;
  if (!envelope || !build.prompt) return [];
  const contract = buildCanonicalProductContract({ prompt: build.prompt });
  const surfaces = resolveUniversalFeatureNamesForCurrentBuild({
    contract,
    envelope,
    workspacePath: build.workspacePath,
    proposedModuleIds: envelope.approvedModulePlan.moduleIds,
  });
  const report = runContractToModuleTraceabilityEvaluation({
    contract,
    envelope,
    workspaceFiles: surfaces.workspaceFiles,
    proposedModuleIds: envelope.approvedModulePlan.moduleIds,
    universalFeatureNames: surfaces.universalFeatureNames,
  });
  return buildCanonicalProductFaithfulnessFindings(report).map((finding) => ({
    readOnly: true as const,
    concept: finding.concept,
    firstBrokenBoundary: finding.firstBrokenBoundary,
    outcome: finding.regenerationStage ? `REQUIRES_REGENERATION_FROM_${finding.regenerationStage}` : 'REQUIRES_REPAIR',
    repairEligibility: finding.repairEligibility,
    regenerationStage: finding.regenerationStage,
    requiredAction: finding.requiredAction,
  }));
}

export function buildRealProductionPathResponseEnvelope(input: {
  build: OnePromptLivePreviewBuildResult;
  normalizedBuild: NormalizedBuildResult;
  executionReport?: BuildExecutionReport | null;
  generationFaithfulness?: GenerationFaithfulnessReport | null;
}): RealProductionPathResponseEnvelope {
  const build = input.build;
  const outcome = resolveProductionSurfaceBuildOutcomeFromResult(build);
  const status = projectProductionSurfaceStatus(outcome);
  const blocked = isBlockedBuildOutcome(outcome);
  const projectTitle = resolveCanonicalProjectTitleForResponse(build);
  const envelope = build.approvedProductionBuildEnvelope;
  const buildContext = envelope
    ? createProductionBuildContext({
        envelope,
        projectId: build.projectId,
        workspaceId: build.workspaceId ?? build.projectId,
      })
    : null;
  const approvedNavIds = envelope?.approvedNavigationPlan.navigationItems.map((item) => item.moduleId) ?? [];
  const navInputs = envelope?.approvedNavigationPlan.productEntries ?? [];
  const canonicalRootCauseFindings = canonicalRootCauseFindingsFromBuild(build);
  const timeline = projectCanonicalProductionTimeline(build);
  const diagnostics = projectProductionDiagnosticReport(build);
  const rootCauseReport = projectProductionRootCauseReport(build.buildId, canonicalRootCauseFindings);
  const progressItems: ProductionPathProgressItem[] = timeline.events.map((event) => ({
    readOnly: true as const,
    label: event.label,
    status: mapTimelineStateToWorkLogStatus(event.state),
    detail: event.detail,
    stageId: event.stageId,
  }));
  const runtimeStarted = !blocked && (build.devServerRunning === true || build.npmInstallOk === true);
  const livePreviewReady = !blocked && build.livePreviewAvailable === true;
  const workspaceArtifacts = emitTimelineDiagnosticWorkspaceArtifacts({
    timeline,
    diagnostics,
    rootCause: rootCauseReport,
    statusProjection: {
      readOnly: true,
      buildOutcome: outcome,
      executionStatus: status.executionStatus,
      completionMessage: status.completionWording,
      currentStage: status.currentStage,
      heartbeat: status.heartbeat,
      nextStep: status.nextStep,
      previewAvailable: status.previewAvailable,
      runtimeStarted,
      livePreviewReady,
      diagnosticsSummary: diagnostics.summaryLines,
    },
  });

  return {
    readOnly: true,
    productionPath: {
      browserHandler: BUILDER_HOME_BUILD_HANDLER,
      apiEndpoint: BUILD_FROM_PROMPT_PRODUCTION_PATH,
      serverHandler: 'server/build-from-prompt-handler.ts :: handleBuildFromPromptRequest',
      orchestratorEntry: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts :: runOnePromptLivePreviewBuild',
      responseSerializer: 'server/build-from-prompt-handler.ts :: sendBuildJson + buildRealProductionPathResponseEnvelope',
      clientStateApplier: 'public/founder-reality/builder-home.js :: applyBuildPayload',
    },
    buildRequestId: build.buildId,
    buildOutcome: outcome,
    buildStatus: blocked ? 'FAILED' : build.status === 'READY' ? 'READY' : build.status === 'BUILDING' ? 'BUILDING' : 'FAILED',
    executionStatus: status.executionStatus,
    completionMessage: status.completionWording,
    currentStage: status.currentStage,
    heartbeat: status.heartbeat,
    nextStep: status.nextStep,
    previewAvailable: status.previewAvailable,
    runtimeStarted,
    livePreviewReady,
    projectTitle,
    buildContextId: buildContext?.buildContextId ?? null,
    canonicalRootCauseFindings,
    timeline,
    diagnostics,
    rootCauseReport,
    progressItems,
    workspaceArtifacts,
    observability: {
      readOnly: true,
      buildRequestId: build.buildId,
      buildContextId: buildContext?.buildContextId ?? null,
      approvedProductIdentity: projectTitle,
      approvedNavigationIds: approvedNavIds,
      finalGeneratorNavigationInputs: navInputs,
      gpcaPreGenerationBlocked: build.gpcaHardStop === true && build.gpcaBlockedMaterialization === true,
      buildOutcome: outcome,
      responseProjectTitle: projectTitle,
      previewAvailable: status.previewAvailable,
      executionStatus: status.executionStatus,
    },
  };
}

export function applyRealProductionPathProjectionToBuild(
  build: OnePromptLivePreviewBuildResult,
): OnePromptLivePreviewBuildResult {
  const outcome = resolveProductionSurfaceBuildOutcomeFromResult(build);
  const blocked = isBlockedBuildOutcome(outcome);
  const projectTitle = resolveCanonicalProjectTitleForResponse(build);
  if (!blocked) {
    return { ...build, projectName: projectTitle };
  }
  // Preserve an unlocked preview as diagnostic so founders can still open the running app when
  // a later gate (e.g. PREVIEW_AUTHORITY) fails. Do not claim livePreviewAvailable/READY.
  const unlockedPreviewUrl =
    build.previewUrl ??
    build.previewContract?.previewUrl ??
    (build.livePreviewGate && typeof build.livePreviewGate === 'object'
      ? (build.livePreviewGate as { previewUrl?: string | null }).previewUrl ?? null
      : null) ??
    build.diagnosticPreviewUrl ??
    null;
  const gateUnlocked =
    build.previewStatus === 'UNLOCKED' ||
    (build.livePreviewGate &&
      typeof build.livePreviewGate === 'object' &&
      String((build.livePreviewGate as { state?: string }).state ?? '').includes('UNLOCKED'));

  return {
    ...build,
    projectName: projectTitle,
    status: 'FAILED',
    buildResult: 'FAIL',
    livePreviewAvailable: false,
    previewUrl: null,
    diagnosticPreviewUrl:
      gateUnlocked && unlockedPreviewUrl
        ? unlockedPreviewUrl
        : build.diagnosticPreviewUrl ?? unlockedPreviewUrl,
    // Keep runtime truth when a gate-unlocked Vite URL still exists — stripping it hides
    // a working preview behind a failed E2E authority check.
    devServerRunning: Boolean(gateUnlocked && unlockedPreviewUrl) || build.devServerRunning,
  };
}

export function applyRealProductionPathProjectionToNormalizedBuild(
  normalized: NormalizedBuildResult,
  envelope: RealProductionPathResponseEnvelope,
): NormalizedBuildResult {
  const blocked = isBlockedBuildOutcome(envelope.buildOutcome as BuildOutcome);
  if (!blocked) return normalized;

  const diagnosticFailures =
    envelope.diagnostics.summaryLines.length > 0
      ? envelope.diagnostics.summaryLines
      : [envelope.completionMessage];

  return {
    ...normalized,
    result: 'FAILED_BLOCKED',
    showLivePreview: false,
    summary: {
      ...normalized.summary,
      headline: envelope.completionMessage,
      whatToDoNext: envelope.nextStep,
      whatWorked: [],
      whatFailed: [...diagnosticFailures],
    },
    buildExecution: normalized.buildExecution
      ? {
          ...normalized.buildExecution,
          state: 'BLOCKED',
          headline: envelope.completionMessage,
          currentStageLabel: envelope.currentStage,
          heartbeatLabel: envelope.heartbeat,
          nextStepLabel: envelope.nextStep,
        }
      : {
          readOnly: true,
          state: 'BLOCKED',
          currentStageLabel: envelope.currentStage,
          elapsedLabel: '—',
          heartbeatLabel: envelope.heartbeat,
          recoveryLabel: null,
          nextStepLabel: envelope.nextStep,
          headline: envelope.completionMessage,
        },
    generationFaithfulness: normalized.generationFaithfulness
      ? {
          ...normalized.generationFaithfulness,
          repairsPerformed: [],
          recoveredConcepts: [],
          remainingMissingConcepts: envelope.canonicalRootCauseFindings.map((finding) => finding.concept),
          headline: 'Canonical traceability root-cause report',
          reason: envelope.canonicalRootCauseFindings.length
            ? envelope.canonicalRootCauseFindings
                .map(
                  (finding) =>
                    `${finding.concept}: first broken at ${finding.firstBrokenBoundary}. ${finding.requiredAction}`,
                )
                .join(' ')
            : envelope.diagnostics.rootCause ?? normalized.generationFaithfulness.reason,
        }
      : null,
    stages: {
      ...normalized.stages,
      previewReady: false,
      buildOutputReady: false,
      executionHealthy: false,
    },
  };
}
