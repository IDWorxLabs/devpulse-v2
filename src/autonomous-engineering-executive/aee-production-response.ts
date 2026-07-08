/**
 * Autonomous Engineering Executive V1 — production response alignment.
 * Ensures Command Center responses reflect AEE-controlled build results, not legacy ASE abort payloads.
 */

import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { AeeFinalReport, AeeExecutiveDecisionResult } from './aee-types.js';
import { AEE_OVERRIDE_ASE_DENIAL_EVENT } from './aee-types.js';
import { buildStatusSeparateFromPreview } from './aee-preview-contract.js';
import type { BuildProfileClassificationEvidence } from '../build-result-conversational-intelligence/build-result-conversational-types.js';

export const BUILD_RESPONSE_SOURCE_AEE_CONTROLLED = 'AEE_CONTROLLED_RESULT' as const;

export const AEE_PRODUCTION_RESPONSE_ALIGNMENT_V1_PASS_TOKEN =
  'AEE_PRODUCTION_RESPONSE_ALIGNMENT_V1_PASS' as const;

const ASE_FAILURE_PATTERNS = [
  /ase denied/i,
  /materialization authorization/i,
  /blueprint validation/i,
  /planning_failed/i,
] as const;

const PREVIEW_NOT_ATTEMPTED_PATTERNS = [
  /live preview could not be generated/i,
  /preview could not be generated/i,
  /preview unavailable/i,
] as const;

const PREVIEW_GATE_ONLY_FAILURE_PATTERNS = [
  /live preview gate blocked/i,
  /preview gate remained locked/i,
  /preview locked/i,
  /gate blocked preview unlock/i,
] as const;

export function aeeOverrideWasApplied(result: OnePromptLivePreviewBuildResult): boolean {
  const decision = result.aeeExecutiveDecision;
  const report = result.aeeFinalReport;
  return (
    decision?.overrideEvent === AEE_OVERRIDE_ASE_DENIAL_EVENT ||
    (report?.overrideEvents ?? []).includes(AEE_OVERRIDE_ASE_DENIAL_EVENT) ||
    (decision?.overriddenBlockers ?? []).some((b) => ASE_FAILURE_PATTERNS.some((p) => p.test(b)))
  );
}

export function buildSpineReachedInstallOrBeyond(result: OnePromptLivePreviewBuildResult): boolean {
  const report = result.aeeFinalReport;
  if (result.npmInstallOk || result.npmBuildOk) return true;
  if (report?.npmInstallResult === 'PASS' || report?.npmBuildResult === 'PASS') return true;
  const stage = report?.buildSpineStageReached ?? result.aeeExecutiveDecision?.furthestStageReached;
  if (!stage) return false;
  return ['INSTALLING', 'BUILDING', 'AUTO_REPAIRING', 'PREVIEWING', 'VERIFYING', 'FINAL_REPORT'].includes(
    stage,
  );
}

export function previewStageWasAttempted(result: OnePromptLivePreviewBuildResult): boolean {
  if (result.previewUrl || result.diagnosticPreviewUrl || result.devServerRunning) return true;
  const report = result.aeeFinalReport;
  if (report?.previewResult === 'PASS' || report?.previewResult === 'DEGRADED' || report?.previewResult === 'FAIL') {
    return true;
  }
  const manifest = result.materializationManifest;
  return (manifest?.previewDurationMs ?? 0) > 0 || (manifest?.stageHistory?.some((s) => s.stage === 'PREVIEW') ?? false);
}

export function isStaleAseFailureReason(reason: string | null | undefined): boolean {
  if (!reason) return false;
  return ASE_FAILURE_PATTERNS.some((pattern) => pattern.test(reason));
}

export function resolveAeeControlledFailureReason(
  result: OnePromptLivePreviewBuildResult,
): string | null {
  const raw = result.failureReason;
  if (!raw) return null;

  if (aeeOverrideWasApplied(result) && isStaleAseFailureReason(raw)) {
    if (buildSpineReachedInstallOrBeyond(result)) {
      if (!previewStageWasAttempted(result)) {
        return 'Build spine progressed through npm install/build after AEE override; preview was not yet attempted.';
      }
      return (
        result.aeeFinalReport?.remainingGaps[0] ??
        (raw.replace(/ase denied.*$/i, '').trim() || null)
      );
    }
  }

  if (buildSpineReachedInstallOrBeyond(result) && isStaleAseFailureReason(raw)) {
    return null;
  }

  if (!previewStageWasAttempted(result) && PREVIEW_NOT_ATTEMPTED_PATTERNS.some((p) => p.test(raw))) {
    return null;
  }

  if (
    result.npmBuildOk &&
    result.status === 'READY' &&
    PREVIEW_GATE_ONLY_FAILURE_PATTERNS.some((p) => p.test(raw))
  ) {
    return null;
  }

  return raw;
}

export function shouldSuppressProfileMismatchForBuild(
  result: OnePromptLivePreviewBuildResult,
  classification: BuildProfileClassificationEvidence,
): boolean {
  if (result.generatedProfile !== 'GENERIC_CUSTOM_APP_V1') return false;
  const faithfulnessPass =
    result.materializationManifest?.promptFaithfulnessStatus === 'PASS' ||
    (result.materializationManifest?.promptFaithfulnessScore ?? 0) >= 80;
  const customModules =
    (result.materializationManifest?.promptDerivedModules?.length ?? 0) > 0 ||
    (result.aeeFinalReport?.generatedModules.length ?? 0) > 0;
  return faithfulnessPass && customModules && classification.alignmentVerdict === 'PROFILE_MISMATCH';
}

export function refineProfileClassificationForAeeBuild(
  result: OnePromptLivePreviewBuildResult,
  classification: BuildProfileClassificationEvidence,
): BuildProfileClassificationEvidence {
  if (!shouldSuppressProfileMismatchForBuild(result, classification)) {
    return classification;
  }
  return {
    ...classification,
    alignmentVerdict: 'ALIGNED',
    profileMismatchWarnings: [],
    alignmentReason:
      'GENERIC_CUSTOM_APP_V1 accepted — prompt faithfulness passed with prompt-derived feature modules.',
  };
}

export function resolveAeeControlledBuildStatus(result: OnePromptLivePreviewBuildResult): {
  effectiveStatus: OnePromptLivePreviewBuildResult['status'];
  effectiveBuildResult: OnePromptLivePreviewBuildResult['buildResult'];
  outcomeCategory:
    | 'SUCCESS'
    | 'FAILED'
    | 'PARTIAL'
    | 'PROFILE_MISMATCH'
    | 'PREVIEW_UNAVAILABLE'
    | 'IN_PROGRESS'
    | 'AEE_SPINE_PARTIAL';
} {
  const report = result.aeeFinalReport;
  const spinePartial = buildSpineReachedInstallOrBeyond(result) && result.status === 'FAILED';

  if (result.status === 'BUILDING') {
    return { effectiveStatus: 'BUILDING', effectiveBuildResult: result.buildResult, outcomeCategory: 'IN_PROGRESS' };
  }

  if (result.status === 'READY') {
    if (result.npmBuildOk && !result.livePreviewAvailable) {
      return {
        effectiveStatus: 'READY',
        effectiveBuildResult: 'PASS',
        outcomeCategory: 'PARTIAL',
      };
    }
    return { effectiveStatus: 'READY', effectiveBuildResult: result.buildResult, outcomeCategory: 'SUCCESS' };
  }

  if (spinePartial) {
    if (!previewStageWasAttempted(result)) {
      return {
        effectiveStatus: 'FAILED',
        effectiveBuildResult: 'FAIL',
        outcomeCategory: 'AEE_SPINE_PARTIAL',
      };
    }
    if (result.npmBuildOk && !result.livePreviewAvailable) {
      return {
        effectiveStatus: 'FAILED',
        effectiveBuildResult: 'FAIL',
        outcomeCategory: 'PREVIEW_UNAVAILABLE',
      };
    }
    return {
      effectiveStatus: 'FAILED',
      effectiveBuildResult: 'FAIL',
      outcomeCategory: 'PARTIAL',
    };
  }

  return { effectiveStatus: result.status, effectiveBuildResult: result.buildResult, outcomeCategory: 'FAILED' };
}

export function buildAeeControlledResponseEnvelope(
  result: OnePromptLivePreviewBuildResult,
): Record<string, unknown> {
  const report = result.aeeFinalReport;
  const decision = result.aeeExecutiveDecision;
  const statusSplit = buildStatusSeparateFromPreview({
    npmInstallOk: result.npmInstallOk,
    npmBuildOk: result.npmBuildOk,
    previewStatus: result.previewContract?.previewStatus ?? result.previewStatus ?? null,
    livePreviewAvailable: result.livePreviewAvailable,
  });
  return {
    readOnly: true,
    buildResponseSource: BUILD_RESPONSE_SOURCE_AEE_CONTROLLED,
    buildStatus: statusSplit.buildStatus,
    previewStatus: statusSplit.previewStatus,
    aeeFinalDecision: report?.finalDecision ?? decision?.decision ?? null,
    aeeFinalOutcome: report?.finalOutcome ?? decision?.outcome ?? null,
    aeeFurthestStageReached: report?.buildSpineStageReached ?? decision?.furthestStageReached ?? null,
    aeeOverrideEvents: report?.overrideEvents ?? (decision?.overrideEvent ? [decision.overrideEvent] : []),
    aeeBlockersOverridden: report?.blockersOverridden ?? decision?.overriddenBlockers ?? [],
    aeeBlockersRespected: report?.blockersRespected ?? decision?.respectedBlockers ?? [],
    npmInstallResult: report?.npmInstallResult ?? (result.npmInstallOk ? 'PASS' : 'FAIL'),
    npmBuildResult: report?.npmBuildResult ?? (result.npmBuildOk ? 'PASS' : 'FAIL'),
    buildAutofixReport: report?.buildAutofixReport ?? result.buildAutofixLoop?.report ?? null,
    previewResult:
      report?.previewResult ??
      (result.livePreviewAvailable
        ? 'PASS'
        : result.previewStatus === 'DEGRADED' || (previewStageWasAttempted(result) && result.npmBuildOk)
          ? 'DEGRADED'
          : previewStageWasAttempted(result)
            ? 'FAIL'
            : 'PENDING'),
    livePreviewUrl: report?.livePreviewUrl ?? result.previewUrl ?? result.diagnosticPreviewUrl ?? null,
    previewStageAttempted: previewStageWasAttempted(result),
    buildSpineReachedInstallOrBeyond: buildSpineReachedInstallOrBeyond(result),
    aeeOverrideApplied: aeeOverrideWasApplied(result),
    previewContractSummary:
      report?.previewContractSummary ?? result.previewContract?.summary ?? null,
    previewRouteProbeOk: result.previewContract?.routeProbe.ok ?? null,
    userFacingFailureReason: resolveAeeControlledFailureReason(result),
  };
}

export function composeAeeAwareBuildChatResponse(result: OnePromptLivePreviewBuildResult): string {
  const profileLabel = result.generatedProfile ?? 'your application';
  const envelope = buildAeeControlledResponseEnvelope(result);
  const report = result.aeeFinalReport;
  const faithfulnessLine =
    result.materializationManifest?.promptFaithfulnessStatus
      ? `Prompt faithfulness: ${result.materializationManifest.promptFaithfulnessStatus}`
      : null;

  if (result.status === 'READY') {
    const reportOutcome = report?.finalOutcome ?? envelope.aeeFinalOutcome;
    if (reportOutcome === 'BUILD_COMPLETED_WITH_BUILD_ERRORS') {
      const autofixLine = report?.buildAutofixReport
        ? [
            `npm build initial: ${report.buildAutofixReport.npmBuildInitialResult}`,
            `failure class: ${report.buildAutofixReport.initialFailureClass}`,
            `AutoFix attempts: ${report.buildAutofixReport.autofixAttempts.length}`,
            `files changed: ${report.buildAutofixReport.filesChanged.join(', ') || 'none'}`,
            `final build status: ${report.buildAutofixReport.finalBuildStatus}`,
            report.buildAutofixReport.remainingErrors.length
              ? `remaining errors: ${report.buildAutofixReport.remainingErrors.join('; ')}`
              : null,
          ]
            .filter(Boolean)
            .join('\n')
        : null;
      return [
        `"${result.projectName}" completed under AEE control with compile errors after bounded AutoFix.`,
        '',
        'npm install succeeded; npm build did not pass after automatic repair.',
        autofixLine,
        faithfulnessLine,
        '',
        'AEE executed the build AutoFix loop automatically — no manual AutoFix step is required unless you choose to edit the workspace.',
        '',
        'See Execution Trace for full build AutoFix report evidence.',
      ]
        .filter(Boolean)
        .join('\n');
    }

    const previewNote =
      result.livePreviewAvailable && result.previewUrl
        ? `Live Preview is available at ${result.previewUrl}.`
        : result.npmBuildOk
          ? envelope.buildStatus === 'PASS' && envelope.previewStatus === 'DEGRADED'
            ? `Build completed successfully. Preview is DEGRADED — gate verification incomplete but the dev server is available${
                result.diagnosticPreviewUrl ? ` at ${result.diagnosticPreviewUrl}` : ''
              }.`.trim()
            : result.previewRecoveryAttempts && result.previewRecoveryAttempts > 0
            ? `Build completed successfully. AEE ran ${result.previewRecoveryAttempts} bounded preview recovery attempt(s); live preview remains degraded. ${
                result.diagnosticPreviewUrl ? `Diagnostic preview: ${result.diagnosticPreviewUrl}` : ''
              }`.trim()
            : result.previewStatus === 'DEGRADED' || result.diagnosticPreviewUrl
              ? `Build completed successfully. Live preview is degraded — AEE executed automatic preview recovery. ${
                  result.diagnosticPreviewUrl ? `Diagnostic preview: ${result.diagnosticPreviewUrl}` : ''
                }`.trim()
              : 'Build completed; see Execution Trace for preview evidence.'
          : 'Live Preview status is in Execution Trace.';
    return [
      `I've completed the build for "${result.projectName}" using the ${profileLabel} profile.`,
      '',
      envelope.buildStatus === 'PASS'
        ? 'Build status: PASS — npm install and npm build completed successfully.'
        : 'Build status: compile steps may need review.',
      `Preview status: ${String(envelope.previewStatus)}.`,
      faithfulnessLine,
      previewNote,
      envelope.aeeOverrideApplied
        ? `AEE overrode upstream authority denial (${AEE_OVERRIDE_ASE_DENIAL_EVENT}) and continued the build spine.`
        : null,
      '',
      'See Execution Trace for AEE decision, npm stages, and preview evidence.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (result.status === 'BUILDING') {
    return [
      `I'm materializing "${result.projectName}" now.`,
      '',
      'Execution Trace will stream each build spine stage as AEE coordinates the pipeline.',
    ].join('\n');
  }

  if (buildSpineReachedInstallOrBeyond(result)) {
    const npmLine = [
      `npm install: ${envelope.npmInstallResult}`,
      `npm build: ${envelope.npmBuildResult}`,
      `preview: ${envelope.previewResult}`,
    ].join(' · ');
    const stageLine = report?.buildSpineStageReached
      ? `Build spine reached: ${report.buildSpineStageReached}.`
      : null;
    const overrideLine = envelope.aeeOverrideApplied
      ? `AEE decision: ${envelope.aeeFinalDecision} — ${AEE_OVERRIDE_ASE_DENIAL_EVENT} recorded; upstream ASE denial was not treated as final.`
      : report?.finalDecision
        ? `AEE final decision: ${report.finalDecision}.`
        : null;
    const previewLine = previewStageWasAttempted(result)
      ? result.previewUrl || result.diagnosticPreviewUrl
        ? `Preview URL: ${result.previewUrl ?? result.diagnosticPreviewUrl}`
        : 'Preview stage was attempted; Live Preview may remain gated.'
      : 'Preview stage has not been attempted yet — npm install/build evidence is available.';

    const failureLine = resolveAeeControlledFailureReason(result);

    return [
      `"${result.projectName}" build spine progressed under AEE control.`,
      '',
      npmLine,
      stageLine,
      overrideLine,
      faithfulnessLine,
      previewLine,
      failureLine && !isStaleAseFailureReason(failureLine) ? `Remaining gap: ${failureLine}` : null,
      '',
      'Execution Trace includes BUILD_RESPONSE_SOURCE=AEE_CONTROLLED_RESULT.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const failureReason = resolveAeeControlledFailureReason(result);
  return [
    `The build for "${result.projectName}" stopped before the build spine could progress.`,
    '',
    failureReason
      ? `Runtime reported: ${failureReason}`
      : 'The orchestrator stopped before workspace materialization completed.',
    '',
    'Review Execution Trace for the exact failing stage.',
  ].join('\n');
}

export function buildAeeControlledTraceEvent(
  result: OnePromptLivePreviewBuildResult,
): {
  eventTitle: string;
  technicalDetail: string;
  metadata: Record<string, string | number | boolean | null>;
} {
  const envelope = buildAeeControlledResponseEnvelope(result);
  return {
    eventTitle: 'BUILD_RESPONSE_SOURCE=AEE_CONTROLLED_RESULT',
    technicalDetail: [
      `AEE decision=${String(envelope.aeeFinalDecision)}`,
      `furthestStage=${String(envelope.aeeFurthestStageReached)}`,
      `npmInstall=${String(envelope.npmInstallResult)}`,
      `npmBuild=${String(envelope.npmBuildResult)}`,
      `preview=${String(envelope.previewResult)}`,
      envelope.aeeOverrideApplied ? `override=${AEE_OVERRIDE_ASE_DENIAL_EVENT}` : 'override=none',
    ].join(' — '),
    metadata: {
      buildResponseSource: BUILD_RESPONSE_SOURCE_AEE_CONTROLLED,
      aeeFinalDecision: String(envelope.aeeFinalDecision ?? ''),
      aeeFurthestStageReached: String(envelope.aeeFurthestStageReached ?? ''),
      npmInstallResult: String(envelope.npmInstallResult),
      npmBuildResult: String(envelope.npmBuildResult),
      previewResult: String(envelope.previewResult),
      aeeOverrideApplied: envelope.aeeOverrideApplied === true,
    },
  };
}

export function deriveAeeFinalReportFromDecision(
  result: OnePromptLivePreviewBuildResult,
  decision: AeeExecutiveDecisionResult | null | undefined,
): AeeFinalReport | null {
  if (result.aeeFinalReport) return result.aeeFinalReport;
  if (!decision) return null;
  return {
    readOnly: true,
    projectName: result.projectName,
    selectedProfile: String(result.generatedProfile ?? 'unknown'),
    generatedModules: result.materializationManifest?.featureModules ?? [],
    workspacePath: result.workspacePath ?? '',
    buildSpineStageReached: decision.furthestStageReached,
    finalDecision: decision.decision,
    finalOutcome: decision.outcome,
    evidenceProvidersConsulted: decision.evidence.map((e) => e.authority),
    blockersOverridden: decision.overriddenBlockers,
    blockersRespected: decision.respectedBlockers,
    repairAttempts: decision.repairAttempts,
    retryAttempts: decision.retryAttempts,
    previewRecoveryAttempts: decision.previewRecoveryAttempts,
    buildAutofixReport: result.buildAutofixLoop?.report ?? null,
    previewContractSummary: result.previewContract?.summary ?? null,
    npmInstallResult: result.npmInstallOk ? 'PASS' : 'PENDING',
    npmBuildResult: result.npmBuildOk ? 'PASS' : result.npmInstallOk ? 'FAIL' : 'PENDING',
    previewResult: result.livePreviewAvailable ? 'PASS' : 'PENDING',
    livePreviewUrl: result.previewUrl,
    remainingGaps: result.failureReason ? [result.failureReason] : [],
    overrideEvents: decision.overrideEvent ? [decision.overrideEvent] : [],
    recordedAt: result.updatedAt,
  };
}
