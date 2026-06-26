/**
 * Build-path Execution Trace event builder — flight-recorder evidence for one-prompt builds.
 */

import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import { analyzeBuildProfileClassification } from '../build-result-conversational-intelligence/build-result-classification-evidence.js';
import { rankBuildProfiles } from '../build-profile-classification/index.js';
import { tagOperatorFeedEventWithProjectId } from '../project-isolation-guard-v1/index.js';
import type { ExecutionTraceEvent, ExecutionTraceSeverity, ExecutionTraceStatus } from './execution-trace-types.js';
import { executionTraceEventToOperatorFeed } from './execution-trace-legacy-adapters.js';
import type { OperatorFeedEvent } from '../command-center-brain/brain-types.js';
import { createExecutionTraceEvidenceBundle } from './execution-trace-evidence-store.js';
import type { ExecutionTraceEvidenceBundle } from './execution-trace-types.js';
import { buildProductionValidationTraceEvents } from '../production-validation/production-validation-trace-events.js';
import type { ProductionValidationEvidence } from '../production-validation/production-validation-types.js';
import { buildBlueprintPurityTraceEvents } from '../blueprint-purity/blueprint-purity-trace-events.js';
import type { BlueprintPurityEvidence } from '../blueprint-purity/blueprint-purity-types.js';
import { buildBuildHistoryTraceEvents } from '../build-history-integrity/build-history-trace-events.js';
import type { BuildHistoryIntegrityEvidence } from '../build-history-integrity/build-history-types.js';
import { buildPersistentProjectRealityTraceEvents } from '../persistent-project-reality/persistent-project-reality-trace-events.js';
import type { PersistentProjectRealityEvidence } from '../persistent-project-reality/persistent-project-reality-types.js';
import { buildMaterializationQualityScoreTraceEvents } from '../materialization-quality-score/materialization-quality-score-trace-events.js';
import type { MaterializationQualityScoreEvidence } from '../materialization-quality-score/materialization-quality-score-types.js';
import { buildFeatureContractRealityTraceEvents } from '../feature-contract-reality/feature-contract-reality-trace-events.js';
import type { FeatureContractRealityEvidence } from '../feature-contract-reality/feature-contract-reality-types.js';
import { buildWorkspaceRealityAuditTraceEvents } from '../workspace-reality-audit/workspace-reality-audit-trace-events.js';
import type { WorkspaceRealityAuditEvidence } from '../workspace-reality-audit/workspace-reality-audit-types.js';
import { buildUniversalProductionProofTraceEvents } from '../universal-production-proof/universal-production-proof-trace-events.js';
import type { UniversalProductionProofEvidence } from '../universal-production-proof/universal-production-proof-types.js';
import {
  buildPromptFaithfulnessManifestFields,
  buildPromptFaithfulnessTraceEvents,
  resolvePromptFaithfulBuildPlan,
} from '../prompt-faithful-generation/index.js';
import { buildIntentUnderstandingTraceEvents } from '../intent-understanding-engine/index.js';

type BuildTraceStage = {
  runtimeStage: string;
  component: string;
  eventTitle: string;
  technicalDetail: string;
  severity: ExecutionTraceSeverity;
  when: (r: OnePromptLivePreviewBuildResult) => boolean;
  artifactLinks?: (r: OnePromptLivePreviewBuildResult) => string[];
  metadata?: (r: OnePromptLivePreviewBuildResult) => Record<string, string | number | boolean | string[] | null>;
  milestone?: boolean;
};

const BUILD_TRACE_STAGES: BuildTraceStage[] = [
  {
    runtimeStage: 'Build',
    component: 'intent_router',
    eventTitle: 'Prompt received',
    technicalDetail: 'Build request recognized — routing to AiDevEngine build orchestration.',
    severity: 'INFO',
    when: () => true,
    milestone: true,
  },
  {
    runtimeStage: 'Planning',
    component: 'intent_understanding_engine',
    eventTitle: 'Product Intelligence Model built',
    technicalDetail: 'Intent Understanding Engine produced authoritative Product Intelligence Model.',
    severity: 'INFO',
    when: () => true,
    milestone: true,
  },
  {
    runtimeStage: 'Build',
    component: 'profile_classifier',
    eventTitle: 'Intent classified',
    technicalDetail: 'Profile candidates ranked from prompt keywords.',
    severity: 'INFO',
    when: () => true,
    metadata: (r) => ({
      selectedProfile: r.generatedProfile ?? 'unknown',
    }),
    milestone: true,
  },
  {
    runtimeStage: 'Build',
    component: 'plan_contract',
    eventTitle: 'Plan contract produced',
    technicalDetail: 'Architecture, requirements, and build-ready plan contract produced.',
    severity: 'INFO',
    when: (r) => Boolean(r.planningProofLevel),
    milestone: true,
  },
  {
    runtimeStage: 'Build',
    component: 'materialization_engine',
    eventTitle: 'Workspace created',
    technicalDetail: 'Generated application source under .generated-builder-workspaces/.',
    severity: 'INFO',
    when: (r) => Boolean(r.materializationProofLevel || r.workspacePath),
    artifactLinks: (r) => (r.workspacePath ? [r.workspacePath] : []),
    metadata: (r) => ({ category: 'artifact', workspacePath: r.workspacePath ?? null }),
    milestone: true,
  },
  {
    runtimeStage: 'Build',
    component: 'blueprint_materializer',
    eventTitle: 'App shell generated',
    technicalDetail: 'Universal App Blueprint shell, App.tsx, and route registry written.',
    severity: 'INFO',
    when: (r) => Boolean(r.workspacePath),
    metadata: () => ({ category: 'artifact', module: 'shell' }),
  },
  {
    runtimeStage: 'Build',
    component: 'blueprint_materializer',
    eventTitle: 'Feature modules generated',
    technicalDetail: 'Modular feature folders with component, types, service, and validation files.',
    severity: 'INFO',
    when: (r) => Boolean(r.workspacePath),
    metadata: () => ({ category: 'artifact', module: 'features' }),
  },
  {
    runtimeStage: 'Build',
    component: 'manifest_writer',
    eventTitle: 'Manifest written',
    technicalDetail: '.generated-app-manifest.json recorded with feature modules and validation metadata.',
    severity: 'INFO',
    when: (r) => Boolean(r.workspacePath),
    artifactLinks: (r) =>
      r.workspacePath ? [`${r.workspacePath}/.generated-app-manifest.json`] : [],
    metadata: () => ({ category: 'artifact', file: '.generated-app-manifest.json' }),
  },
  {
    runtimeStage: 'Validation',
    component: 'materialization_validator',
    eventTitle: 'Blueprint validation',
    technicalDetail: 'Materialization validation — npm build alone is not sufficient for PASS.',
    severity: 'INFO',
    when: (r) => r.status === 'READY' && r.buildResult === 'PASS',
    metadata: (r) => ({ result: r.buildResult ?? 'unknown' }),
    milestone: true,
  },
  {
    runtimeStage: 'Build',
    component: 'npm_install',
    eventTitle: 'npm install',
    technicalDetail: 'npm install completed for generated Vite React workspace.',
    severity: 'INFO',
    when: (r) => r.npmInstallOk,
    metadata: () => ({ category: 'artifact', command: 'npm install', result: 'PASS' }),
    milestone: true,
  },
  {
    runtimeStage: 'Build',
    component: 'npm_build',
    eventTitle: 'npm build',
    technicalDetail: 'npm run build completed for generated application.',
    severity: 'INFO',
    when: (r) => r.npmBuildOk,
    metadata: () => ({ category: 'artifact', command: 'npm run build', result: 'PASS' }),
    milestone: true,
  },
  {
    runtimeStage: 'Preview',
    component: 'live_preview_runtime',
    eventTitle: 'Preview started',
    technicalDetail: 'Vite dev server started for generated workspace.',
    severity: 'INFO',
    when: (r) => r.status === 'READY' && Boolean(r.previewUrl),
    artifactLinks: (r) => (r.previewUrl ? [r.previewUrl] : []),
    metadata: (r) => ({ previewUrl: r.previewUrl ?? null, category: 'artifact' }),
    milestone: true,
  },
];

function statusForStage(
  result: OnePromptLivePreviewBuildResult,
  matched: boolean,
  failedAt: number | null,
  step: number,
): ExecutionTraceStatus {
  if (matched) return result.status === 'READY' ? 'PASS' : 'Completed';
  if (result.status === 'FAILED' && failedAt === step) return 'Blocked';
  return 'Queued';
}

function severityForStage(
  result: OnePromptLivePreviewBuildResult,
  matched: boolean,
  failedAt: number | null,
  step: number,
  base: ExecutionTraceSeverity,
): ExecutionTraceSeverity {
  if (result.status === 'FAILED' && failedAt === step) return 'ERROR';
  if (!matched && result.status === 'FAILED') return 'WARN';
  return base;
}

export function buildOnePromptExecutionTraceEvents(
  result: OnePromptLivePreviewBuildResult,
  prompt?: string,
): ExecutionTraceEvent[] {
  const events: ExecutionTraceEvent[] = [];
  const ts = Date.parse(result.updatedAt) || Date.now();
  const total = BUILD_TRACE_STAGES.length + 2;
  let step = 0;
  let failedAt: number | null = null;

  if (prompt) {
    const faithfulnessPlan = resolvePromptFaithfulBuildPlan(prompt);
    const intentTrace = buildIntentUnderstandingTraceEvents(faithfulnessPlan.productIntelligenceModel);
    for (const intentEvent of intentTrace) {
      step += 1;
      events.push({
        ...intentEvent,
        eventId: `${result.buildId}-trace-intent-${step}`,
        timestamp: ts + step,
        informationalOnly: true,
        section: 'Planning',
        action: intentEvent.eventTitle,
        detail: intentEvent.technicalDetail,
        stepIndex: step,
        stepTotal: total + intentTrace.length,
      });
    }

    const ranking = rankBuildProfiles(prompt);
    const classification = analyzeBuildProfileClassification(prompt, result.generatedProfile);
    const candidateLines = ranking.rankings
      .slice(0, 5)
      .map((p) => `${p.profile} ${Math.round(p.score * 100)}%`)
      .join('\n');
    events.push({
      eventId: `${result.buildId}-trace-classify`,
      timestamp: ts,
      runtimeStage: 'Build',
      component: 'profile_classifier',
      severity: 'INFO',
      eventTitle: 'Intent classified',
      technicalDetail: [
        'Profile candidates:',
        candidateLines || 'none',
        '',
        'Selected:',
        result.generatedProfile ?? ranking.selectedProfile ?? 'unknown',
        '',
        'Reason:',
        classification.alignmentReason || 'Highest weighted keyword score.',
      ].join('\n'),
      status: 'Completed',
      metadata: {
        milestone: true,
        selectedProfile: result.generatedProfile ?? null,
        alignmentVerdict: classification.alignmentVerdict,
        matchedKeywords: classification.matchedKeywords,
      },
      informationalOnly: true,
      section: 'Build',
      action: 'Intent classified',
      detail: classification.alignmentReason,
      stepIndex: 1,
      stepTotal: total,
    });
    step = 1 + intentTrace.length;

    const faithfulnessModules =
      result.materializationManifest?.featureModules ??
      faithfulnessPlan.definition.featureModules;
    const faithfulnessFields = buildPromptFaithfulnessManifestFields({
      rawPrompt: prompt,
      selectedProfile: String(result.generatedProfile ?? faithfulnessPlan.materializationProfile),
      generatedModules: faithfulnessModules,
      guardResult: faithfulnessPlan.guardResult,
    });
    const faithfulnessTrace = buildPromptFaithfulnessTraceEvents({
      extraction: faithfulnessPlan.extraction,
      guardResult: faithfulnessPlan.guardResult,
      manifestFields: faithfulnessFields,
    });
    for (const faithEvent of faithfulnessTrace) {
      step += 1;
      events.push({
        ...faithEvent,
        eventId: `${result.buildId}-trace-faith-${step}`,
        timestamp: ts + step,
        informationalOnly: true,
        section: 'Build',
        action: faithEvent.eventTitle,
        detail: faithEvent.technicalDetail,
        stepIndex: step,
        stepTotal: total + faithfulnessTrace.length,
      });
    }
  }

  for (const stage of BUILD_TRACE_STAGES) {
    if (stage.eventTitle === 'Intent classified' && prompt) continue;
    step += 1;
    const matched = stage.when(result);
    if (!matched && failedAt === null && result.status === 'FAILED') {
      failedAt = step;
    }
    const detail =
      failedAt === step
        ? result.failureReason ?? `${stage.eventTitle} failed`
        : matched
          ? stage.technicalDetail
          : `${stage.eventTitle} — pending`;

    events.push({
      eventId: `${result.buildId}-trace-${step}`,
      timestamp: ts + step,
      runtimeStage: stage.runtimeStage,
      component: stage.component,
      severity: severityForStage(result, matched, failedAt, step, stage.severity),
      eventTitle: stage.eventTitle,
      technicalDetail: detail,
      evidence: matched ? result.workspacePath ?? 'one-prompt-live-preview' : undefined,
      artifactLinks: matched && stage.artifactLinks ? stage.artifactLinks(result) : undefined,
      status: statusForStage(result, matched, failedAt, step),
      metadata: {
        milestone: stage.milestone ?? false,
        category: stage.metadata?.(result)?.category ?? 'runtime',
        ...(stage.metadata?.(result) ?? {}),
      },
      informationalOnly: true,
      section: stage.runtimeStage,
      action: stage.eventTitle,
      detail,
      stepIndex: step,
      stepTotal: total,
    });
  }

  step += 1;
  if (result.materializationManifest) {
    const manifest = result.materializationManifest;
    const failedBuild =
      manifest.status === 'FAIL' ||
      manifest.status === 'PARTIAL' ||
      manifest.status === 'ABORTED';
    const hashPreview =
      manifest.materializationHash ||
      manifest.partialMaterializationHash ||
      manifest.workspaceHash ||
      manifest.partialWorkspaceHash ||
      '';

    if (manifest.stageHistory.length > 0) {
      events.push({
        eventId: `${result.buildId}-trace-forensic-init`,
        timestamp: ts + step,
        runtimeStage: 'Build',
        component: 'forensic_manifest',
        severity: 'INFO',
        eventTitle: 'Forensic manifest initialized',
        technicalDetail: `Build run ${manifest.buildRunId} — stage history tracking enabled`,
        status: 'Completed',
        metadata: { milestone: true, buildRunId: manifest.buildRunId },
        informationalOnly: true,
        section: 'Build',
        action: 'Forensic manifest initialized',
        detail: manifest.buildRunId,
        stepIndex: step,
        stepTotal: total + manifest.stageHistory.length + 8,
      });
      step += 1;

      for (const record of manifest.stageHistory) {
        events.push({
          eventId: `${result.buildId}-trace-forensic-stage-${record.stage}-${step}`,
          timestamp: ts + step,
          runtimeStage: 'Build',
          component: 'forensic_manifest',
          severity: record.errors.length > 0 ? 'WARN' : 'INFO',
          eventTitle: `Manifest updated: ${record.stage}`,
          technicalDetail: [
            `status=${record.status}`,
            `files=${record.generatedFilesCount}`,
            record.errors.length ? `errors=${record.errors.join('; ')}` : '',
          ]
            .filter(Boolean)
            .join(' — '),
          status: record.errors.length > 0 ? 'Blocked' : 'Completed',
          metadata: {
            stage: record.stage,
            generatedFilesCount: record.generatedFilesCount,
            generatedDirectoriesCount: record.generatedDirectoriesCount,
          },
          informationalOnly: true,
          section: 'Build',
          action: `Manifest updated: ${record.stage}`,
          detail: record.stage,
          stepIndex: step,
          stepTotal: total + manifest.stageHistory.length + 8,
        });
        step += 1;
      }
    }

    if (failedBuild) {
      events.push({
        eventId: `${result.buildId}-trace-partial-scan`,
        timestamp: ts + step,
        runtimeStage: 'Validation',
        component: 'forensic_manifest',
        severity: 'WARN',
        eventTitle: 'Partial workspace scanned',
        technicalDetail: `${manifest.generatedFilesCount} files and ${manifest.generatedDirectoriesCount} directories recorded before failure`,
        status: 'Completed',
        metadata: {
          milestone: true,
          generatedFilesCount: manifest.generatedFilesCount,
          lastSuccessfulStage: manifest.lastSuccessfulStage ?? null,
        },
        informationalOnly: true,
        section: 'Validation',
        action: 'Partial workspace scanned',
        detail: String(manifest.generatedFilesCount),
        stepIndex: step,
        stepTotal: total + manifest.stageHistory.length + 8,
      });
      step += 1;

      events.push({
        eventId: `${result.buildId}-trace-failure-stage`,
        timestamp: ts + step,
        runtimeStage: 'Validation',
        component: 'forensic_manifest',
        severity: 'ERROR',
        eventTitle: `Build failed at ${manifest.failureStage ?? 'unknown'}`,
        technicalDetail: manifest.failureReason ?? result.failureReason ?? 'Build failed',
        status: 'FAIL',
        metadata: {
          milestone: true,
          failureStage: manifest.failureStage ?? null,
          lastSuccessfulStage: manifest.lastSuccessfulStage ?? null,
          failedCommand: manifest.failedCommand ?? null,
          exitCode: manifest.exitCode ?? null,
        },
        informationalOnly: true,
        section: 'Validation',
        action: `Build failed at ${manifest.failureStage ?? 'unknown'}`,
        detail: manifest.failureReason ?? '',
        stepIndex: step,
        stepTotal: total + manifest.stageHistory.length + 8,
      });
      step += 1;

      if (manifest.partialWorkspaceHash || manifest.partialMaterializationHash) {
        events.push({
          eventId: `${result.buildId}-trace-partial-hash`,
          timestamp: ts + step,
          runtimeStage: 'Validation',
          component: 'forensic_manifest',
          severity: 'INFO',
          eventTitle: 'Partial workspace hash recorded',
          technicalDetail: [
            manifest.partialWorkspaceHash
              ? `partialWorkspaceHash: ${manifest.partialWorkspaceHash.slice(0, 12)}…`
              : null,
            manifest.partialMaterializationHash
              ? `partialMaterializationHash: ${manifest.partialMaterializationHash.slice(0, 12)}…`
              : null,
          ]
            .filter(Boolean)
            .join('\n'),
          status: 'Completed',
          metadata: { category: 'artifact' },
          informationalOnly: true,
          section: 'Validation',
          action: 'Partial workspace hash recorded',
          detail: manifest.partialWorkspaceHash?.slice(0, 12) ?? '',
          stepIndex: step,
          stepTotal: total + manifest.stageHistory.length + 8,
        });
        step += 1;
      }

      events.push({
        eventId: `${result.buildId}-trace-failure-manifest`,
        timestamp: ts + step,
        runtimeStage: 'Validation',
        component: 'forensic_manifest',
        severity: 'ERROR',
        eventTitle: 'Failed build forensic manifest written',
        technicalDetail: `.generated-app-manifest.json — validation ${manifest.validationStatus}`,
        status: 'FAIL',
        artifactLinks: result.workspacePath
          ? [`${result.workspacePath}/.generated-app-manifest.json`]
          : undefined,
        metadata: {
          milestone: true,
          validationStatus: manifest.validationStatus,
          failureStage: manifest.failureStage ?? null,
        },
        informationalOnly: true,
        section: 'Validation',
        action: 'Failed build forensic manifest written',
        detail: manifest.validationStatus,
        stepIndex: step,
        stepTotal: total + manifest.stageHistory.length + 8,
      });
      step += 1;
    }

    const workspaceMb = (manifest.workspaceSizeBytes / (1024 * 1024)).toFixed(2);
    const evidenceStages: Array<{ title: string; detail: string; metadata?: Record<string, unknown> }> =
      failedBuild
        ? []
        : [
      {
        title: 'Workspace scanned',
        detail: `${manifest.generatedFilesCount} files discovered`,
        metadata: { category: 'artifact', milestone: true },
      },
      {
        title: 'Components inventoried',
        detail: `${manifest.generatedComponentsCount} components`,
      },
      {
        title: 'Routes inventoried',
        detail: `${manifest.generatedRoutesCount} routes`,
      },
      {
        title: 'Feature modules inventoried',
        detail: `${manifest.generatedFeatureModulesCount} feature modules`,
      },
      {
        title: 'Workspace size measured',
        detail: `${workspaceMb} MB (${manifest.totalLinesGenerated} source lines)`,
        metadata: { category: 'artifact', milestone: true },
      },
      {
        title: 'Manifest written',
        detail: `.generated-app-manifest.json — validation ${manifest.validationStatus}`,
        metadata: { category: 'artifact', file: '.generated-app-manifest.json' },
      },
      {
        title: 'Materialization evidence complete',
        detail: [
          hashPreview ? `materializationHash: ${hashPreview.slice(0, 12)}…` : 'hash pending',
          `npm install: ${manifest.npmInstallDurationMs}ms`,
          `npm build: ${manifest.npmBuildDurationMs}ms`,
          `preview: ${manifest.previewDurationMs}ms`,
        ].join('\n'),
        metadata: { milestone: true, materializationHash: hashPreview || null },
      },
    ];

    for (const stage of evidenceStages) {
      events.push({
        eventId: `${result.buildId}-trace-evidence-${step}`,
        timestamp: ts + step,
        runtimeStage: 'Validation',
        component: 'materialization_evidence',
        severity: 'INFO',
        eventTitle: stage.title,
        technicalDetail: stage.detail,
        status: 'Completed',
        metadata: stage.metadata as ExecutionTraceEvent['metadata'],
        informationalOnly: true,
        section: 'Validation',
        action: stage.title,
        detail: stage.detail,
        stepIndex: step,
        stepTotal: total + evidenceStages.length + 8,
      });
      step += 1;
    }

    if (manifest.featureModuleDetails.length > 0) {
      for (const moduleEntry of manifest.featureModuleDetails) {
        events.push({
          eventId: `${result.buildId}-trace-modular-${moduleEntry.id}-${step}`,
          timestamp: ts + step,
          runtimeStage: 'Build',
          component: 'modular_feature_materializer',
          severity: 'INFO',
          eventTitle: `Feature module generated: ${moduleEntry.name}`,
          technicalDetail: moduleEntry.componentPath,
          status: 'Completed',
          metadata: { moduleId: moduleEntry.id, contractId: moduleEntry.contractId },
          informationalOnly: true,
          section: 'Build',
          action: `Feature module generated: ${moduleEntry.name}`,
          detail: moduleEntry.componentPath,
          stepIndex: step,
          stepTotal: total + manifest.featureModuleDetails.length * 5 + 12,
        });
        step += 1;
        for (const [label, path] of [
          ['Component written', moduleEntry.componentPath],
          ['Service written', moduleEntry.servicePath],
          ['Types written', moduleEntry.typesPath],
          ['Validation written', moduleEntry.validationPath],
        ] as const) {
          events.push({
            eventId: `${result.buildId}-trace-modular-file-${step}`,
            timestamp: ts + step,
            runtimeStage: 'Build',
            component: 'modular_feature_materializer',
            severity: 'INFO',
            eventTitle: label,
            technicalDetail: path,
            status: 'Completed',
            artifactLinks: result.workspacePath ? [`${result.workspacePath}/${path}`] : undefined,
            metadata: { category: 'artifact', moduleId: moduleEntry.id },
            informationalOnly: true,
            section: 'Build',
            action: label,
            detail: path,
            stepIndex: step,
            stepTotal: total + manifest.featureModuleDetails.length * 5 + 12,
          });
          step += 1;
        }
      }
      for (const title of ['Registry updated', 'Routes updated', 'Feature module validation passed'] as const) {
        events.push({
          eventId: `${result.buildId}-trace-modular-${title}-${step}`,
          timestamp: ts + step,
          runtimeStage: 'Validation',
          component: 'modular_feature_materializer',
          severity: 'INFO',
          eventTitle: title,
          technicalDetail: title,
          status: 'Completed',
          metadata: { milestone: true },
          informationalOnly: true,
          section: 'Validation',
          action: title,
          detail: title,
          stepIndex: step,
          stepTotal: total + manifest.featureModuleDetails.length * 5 + 12,
        });
        step += 1;
      }
    }

    if (
      manifest.productionValidationStages.length > 0 ||
      manifest.productionValidationStatus === 'PASS' ||
      manifest.productionValidationStatus === 'FAIL'
    ) {
      const prodEvidence: ProductionValidationEvidence = {
        readOnly: true,
        profileId: (manifest.productionValidationProfile ?? manifest.selectedProfile) as ProductionValidationEvidence['profileId'],
        prompt: manifest.prompt,
        workspaceDir: result.workspacePath ?? '',
        generatedFilesCount: manifest.generatedFilesCount,
        generatedFeatureModulesCount: manifest.generatedFeatureModulesCount,
        generateStatus: 'PASS',
        installStatus: manifest.npmInstallDurationMs > 0 ? 'PASS' : 'FAIL',
        buildStatus: manifest.npmBuildDurationMs > 0 ? 'PASS' : 'FAIL',
        previewStatus: manifest.previewVerified ? 'PASS' : 'FAIL',
        previewUrl: manifest.previewUrl,
        previewHtmlStatus: manifest.previewHtmlStatus === 'PASS' ? 'PASS' : 'FAIL',
        blueprintValidationStatus: manifest.blueprintShellPresent ? 'PASS' : 'FAIL',
        featureContractValidationStatus:
          manifest.productionValidationStages.find((s) => s.stage === 'feature-contract')?.status ?? 'FAIL',
        promptAlignmentStatus: manifest.promptSpecificTermsPresent ? 'PASS' : 'FAIL',
        generatedUiValidationStatus: manifest.profileSpecificUiVerified ? 'PASS' : 'FAIL',
        modularRoutesVerified: manifest.modularRoutesVerified,
        profileSpecificUiVerified: manifest.profileSpecificUiVerified,
        previewVerified: manifest.previewVerified,
        productionValidationStatus: manifest.productionValidationStatus === 'PASS' ? 'PASS' : 'FAIL',
        durationMs: manifest.productionValidationDurationMs,
        failureReasons: manifest.productionValidationFailureReasons,
        artifactPaths: result.workspacePath ? [result.workspacePath] : [],
        cleanupStatus: 'PASS',
        stages: manifest.productionValidationStages,
        validatedAt: manifest.completedAt ?? result.updatedAt,
      };
      const prodEvents = buildProductionValidationTraceEvents(prodEvidence, result.buildId);
      for (const prodEvent of prodEvents) {
        step += 1;
        events.push({
          ...prodEvent,
          stepIndex: step,
          stepTotal: total + prodEvents.length + 12,
        });
      }
    }

    if (
      manifest.blueprintPurityCheckedFiles.length > 0 ||
      manifest.blueprintPurityStatus === 'PASS' ||
      manifest.blueprintPurityStatus === 'FAIL'
    ) {
      const purityEvidence: BlueprintPurityEvidence = {
        readOnly: true,
        blueprintPurityStatus: manifest.blueprintPurityStatus === 'PASS' ? 'PASS' : 'FAIL',
        blueprintPurityCheckedFiles: manifest.blueprintPurityCheckedFiles,
        blueprintPurityViolationCount: manifest.blueprintPurityViolationCount,
        blueprintPurityAllowedDomainSources: manifest.blueprintPurityAllowedDomainSources,
        blueprintPurityFailureReasons: manifest.blueprintPurityFailureReasons,
        fileResults: [],
        shellPurityVerified: manifest.shellPurityVerified,
        domainLanguageBoundaryVerified: manifest.domainLanguageBoundaryVerified,
        scannedAt: manifest.completedAt ?? result.updatedAt,
      };
      const purityEvents = buildBlueprintPurityTraceEvents(purityEvidence, result.buildId);
      for (const purityEvent of purityEvents) {
        step += 1;
        events.push({
          ...purityEvent,
          stepIndex: step,
          stepTotal: total + purityEvents.length + 12,
        });
      }
    }

    if (
      manifest.buildHistoryRecorded ||
      manifest.buildHistoryIntegrityStatus === 'PASS' ||
      manifest.buildHistoryIntegrityStatus === 'FAIL'
    ) {
      const historyEvidence: BuildHistoryIntegrityEvidence = {
        readOnly: true,
        buildHistoryRecorded: manifest.buildHistoryRecorded,
        buildHistoryRunId: manifest.buildHistoryRunId ?? manifest.buildRunId,
        buildHistoryRecordPath: manifest.buildHistoryRecordPath ?? '',
        buildHistoryRecordHash: manifest.buildHistoryRecordHash ?? '',
        buildHistoryImmutable: manifest.buildHistoryImmutable,
        replayMetadataPath: manifest.replayMetadataPath ?? '',
        auditTimelinePath: manifest.auditTimelinePath ?? '',
        buildHistoryIntegrityStatus:
          manifest.buildHistoryIntegrityStatus === 'PASS' ? 'PASS' : 'FAIL',
        buildHistoryFailureReasons: manifest.buildHistoryFailureReasons,
        deduplicatedRunId: manifest.buildHistoryDeduplicatedRunId,
        productionValidationSnapshotRecorded:
          manifest.productionValidationStatus !== 'PENDING' &&
          Boolean(manifest.buildHistoryRecordPath),
        recordedAt: manifest.buildHistoryRecordedAt ?? manifest.completedAt ?? result.updatedAt,
      };
      const historyEvents = buildBuildHistoryTraceEvents(historyEvidence, result.buildId);
      for (const historyEvent of historyEvents) {
        step += 1;
        events.push({
          ...historyEvent,
          stepIndex: step,
          stepTotal: total + historyEvents.length + 12,
        });
      }
    }

    if (
      manifest.persistentProjectRealityStatus === 'PASS' ||
      manifest.persistentProjectRealityStatus === 'FAIL' ||
      manifest.promotionStatus === 'PASS' ||
      manifest.promotionStatus === 'SKIPPED'
    ) {
      const realityEvidence: PersistentProjectRealityEvidence = {
        readOnly: true,
        persistentProjectRealityStatus:
          manifest.persistentProjectRealityStatus === 'PASS' ? 'PASS' : 'FAIL',
        persistentProjectId: manifest.persistentProjectId ?? manifest.projectId,
        persistentProjectWorkspacePath: manifest.persistentProjectWorkspacePath ?? '',
        persistentProjectSourceRoot: manifest.persistentProjectSourceRoot ?? '',
        projectFileIndexPath: manifest.projectFileIndexPath ?? '',
        exportMetadataPath: manifest.exportMetadataPath ?? '',
        promotedFromBuildWorkspace: manifest.promotedFromBuildWorkspace ?? '',
        promotionStatus:
          manifest.promotionStatus === 'PASS'
            ? 'PASS'
            : manifest.promotionStatus === 'SKIPPED'
              ? 'SKIPPED'
              : 'FAIL',
        promotionFailureReasons: manifest.promotionFailureReasons,
        projectRecordPath: manifest.persistentProjectWorkspacePath
          ? `${manifest.persistentProjectWorkspacePath}/project.json`
          : '',
        recordedAt: manifest.persistentProjectRecordedAt ?? manifest.completedAt ?? result.updatedAt,
      };
      const realityEvents = buildPersistentProjectRealityTraceEvents(realityEvidence, result.buildId);
      for (const realityEvent of realityEvents) {
        step += 1;
        events.push({
          ...realityEvent,
          stepIndex: step,
          stepTotal: total + realityEvents.length + 12,
        });
      }
    }

    if (
      manifest.materializationQualityRecordedAt ||
      manifest.materializationQualityScore > 0 ||
      manifest.materializationQualityVerdict !== 'PENDING'
    ) {
      const qualityEvidence: MaterializationQualityScoreEvidence = {
        readOnly: true,
        materializationQualityScore: manifest.materializationQualityScore,
        materializationQualityVerdict:
          manifest.materializationQualityVerdict === 'PENDING'
            ? 'NEEDS_WORK'
            : manifest.materializationQualityVerdict,
        materializationQualityCategories: manifest.materializationQualityCategories,
        materializationQualityGaps: manifest.materializationQualityGaps,
        materializationQualityStrengths: manifest.materializationQualityStrengths,
        materializationQualityCriticalFailures: manifest.materializationQualityCriticalFailures,
        materializationQualityScorePath: manifest.materializationQualityScorePath,
        materializationQualityPersistentScorePath: manifest.materializationQualityPersistentScorePath,
        materializationQualityRecordedAt:
          manifest.materializationQualityRecordedAt ?? manifest.completedAt ?? result.updatedAt,
      };
      const qualityEvents = buildMaterializationQualityScoreTraceEvents(qualityEvidence, result.buildId);
      for (const qualityEvent of qualityEvents) {
        step += 1;
        events.push({
          ...qualityEvent,
          stepIndex: step,
          stepTotal: total + qualityEvents.length + 12,
        });
      }
    }

    if (
      manifest.featureContractRealityRecordedAt ||
      manifest.featureRealityRecords.length > 0 ||
      manifest.featureContractRealityStatus !== 'PENDING'
    ) {
      const featureEvidence: FeatureContractRealityEvidence = {
        readOnly: true,
        featureContractRealityStatus:
          manifest.featureContractRealityStatus === 'PENDING' ? 'PARTIAL' : manifest.featureContractRealityStatus,
        featureContractRealityScore: manifest.featureContractRealityScore,
        featureRealityRecords: manifest.featureRealityRecords,
        featureRealityFailureReasons: manifest.featureRealityFailureReasons,
        featureContractRealityArtifactPath: manifest.featureContractRealityArtifactPath,
        featureContractRealityPersistentArtifactPath: manifest.featureContractRealityPersistentArtifactPath,
        featureContractRealityRecordedAt:
          manifest.featureContractRealityRecordedAt ?? manifest.completedAt ?? result.updatedAt,
      };
      const featureEvents = buildFeatureContractRealityTraceEvents(featureEvidence, result.buildId);
      for (const featureEvent of featureEvents) {
        step += 1;
        events.push({
          ...featureEvent,
          stepIndex: step,
          stepTotal: total + featureEvents.length + 12,
        });
      }
    }

    if (
      manifest.workspaceRealityRecordedAt ||
      manifest.workspaceRealityAuditStatus !== 'PENDING'
    ) {
      const workspaceEvidence: WorkspaceRealityAuditEvidence = {
        readOnly: true,
        workspaceRealityAuditStatus:
          manifest.workspaceRealityAuditStatus === 'PENDING' ? 'WARN' : manifest.workspaceRealityAuditStatus,
        workspaceRealityAuditScore: manifest.workspaceRealityAuditScore,
        workspaceRealityAuditArtifactPath: manifest.workspaceRealityAuditArtifactPath,
        workspaceRealityReportPath: manifest.workspaceRealityReportPath,
        workspaceRealityFailureReasons: manifest.workspaceRealityFailureReasons,
        workspaceRealityRecordedAt:
          manifest.workspaceRealityRecordedAt ?? manifest.completedAt ?? result.updatedAt,
        workspaceRealityAuditResult: {
          readOnly: true,
          status: manifest.workspaceRealityAuditStatus === 'PENDING' ? 'WARN' : manifest.workspaceRealityAuditStatus,
          score: manifest.workspaceRealityAuditScore,
          dimensions: [],
          orphanFiles: [],
          duplicateModules: [],
          missingImports: [],
          brokenRoutes: [],
          missingAssets: [],
          staleMetadata: [],
          temporaryArtifactLeaks: [],
          exportSafetyIssues: [],
          evidencePaths: [],
          failureReasons: manifest.workspaceRealityFailureReasons,
          auditedSourceRoot: manifest.persistentProjectSourceRoot ?? '',
          recordedAt: manifest.workspaceRealityRecordedAt ?? result.updatedAt,
          buildRunId: manifest.buildRunId,
          projectId: manifest.projectId,
          artifactPath: manifest.workspaceRealityAuditArtifactPath,
          reportPath: manifest.workspaceRealityReportPath,
          persistentArtifactPath: null,
          persistentReportPath: null,
        },
      };
      const workspaceEvents = buildWorkspaceRealityAuditTraceEvents(workspaceEvidence, result.buildId);
      for (const workspaceEvent of workspaceEvents) {
        step += 1;
        events.push({
          ...workspaceEvent,
          stepIndex: step,
          stepTotal: total + workspaceEvents.length + 12,
        });
      }
    }

    if (manifest.universalProductionProofRecordedAt) {
      const proofEvidence: UniversalProductionProofEvidence = {
        readOnly: true,
        universalProductionProofRunId: manifest.universalProductionProofRunId ?? result.buildId,
        universalProductionProofStatus:
          manifest.universalProductionProofStatus === 'PENDING'
            ? 'NOT_UNIVERSALLY_PRODUCTION_READY'
            : manifest.universalProductionProofStatus,
        universalProductionProofArtifactPath: manifest.universalProductionProofArtifactPath ?? '',
        universalProductionProofReportPath: manifest.universalProductionProofArtifactPath ?? '',
        universalProductionProofRecordedAt: manifest.universalProductionProofRecordedAt,
        report: {
          readOnly: true,
          runId: manifest.universalProductionProofRunId ?? result.buildId,
          overallVerdict:
            manifest.universalProductionProofStatus === 'PENDING'
              ? 'NOT_UNIVERSALLY_PRODUCTION_READY'
              : manifest.universalProductionProofStatus,
          profileCount: 1,
          passedProfiles: manifest.universalProductionProofProfileVerdict === 'PASS' ? 1 : 0,
          warnedProfiles: manifest.universalProductionProofProfileVerdict === 'WARN' ? 1 : 0,
          failedProfiles: manifest.universalProductionProofProfileVerdict === 'FAIL' ? 1 : 0,
          matrix: [],
          profileResults: [],
          allowedWarnings: [],
          failureReasons: [],
          artifactPath: manifest.universalProductionProofArtifactPath ?? '',
          reportPath: '',
          chatSummary: '',
          recordedAt: manifest.universalProductionProofRecordedAt,
        },
      };
      const proofEvents = buildUniversalProductionProofTraceEvents(proofEvidence, result.buildId);
      for (const proofEvent of proofEvents) {
        step += 1;
        events.push({
          ...proofEvent,
          stepIndex: step,
          stepTotal: total + proofEvents.length + 12,
        });
      }
    }
  }

  step += 1;
  const finalTitle = result.status === 'READY' ? 'Preview ready' : 'Build failed';
  const finalDetail =
    result.status === 'READY'
      ? `Live Preview available at ${result.previewUrl ?? 'unknown URL'}`
      : result.failureReason ?? 'One-prompt build failed';

  events.push({
    eventId: `${result.buildId}-trace-final`,
    timestamp: ts + step,
    runtimeStage: result.status === 'READY' ? 'Preview' : 'Validation',
    component: 'build_orchestrator',
    severity: result.status === 'READY' ? 'INFO' : 'ERROR',
    eventTitle: finalTitle,
    technicalDetail: finalDetail,
    evidence: result.workspacePath ?? undefined,
    artifactLinks: result.previewUrl ? [result.previewUrl] : undefined,
    status: result.status === 'READY' ? 'PASS' : 'FAIL',
    metadata: {
      milestone: true,
      buildStatus: result.status,
      previewUrl: result.previewUrl ?? null,
      buildResult: result.buildResult ?? null,
    },
    informationalOnly: true,
    section: 'Build',
    action: finalTitle,
    detail: finalDetail,
    stepIndex: step,
    stepTotal: total,
  });

  return events.map((event) => {
    const legacy = executionTraceEventToOperatorFeed(event);
    const tagged = tagOperatorFeedEventWithProjectId(legacy, result.projectId ?? null, {
      scope: 'PROJECT',
    });
    return {
      ...event,
      eventId: tagged.eventId,
      evidence: tagged.evidence ?? event.evidence,
    };
  });
}

/** @deprecated Use buildOnePromptExecutionTraceEvents */
export function buildOnePromptOperatorFeedEvents(
  result: OnePromptLivePreviewBuildResult,
  prompt?: string,
): OperatorFeedEvent[] {
  return buildOnePromptExecutionTraceEvents(result, prompt).map(executionTraceEventToOperatorFeed);
}

export function buildOnePromptExecutionTraceEvidence(
  result: OnePromptLivePreviewBuildResult,
  prompt?: string,
): ExecutionTraceEvidenceBundle {
  const events = buildOnePromptExecutionTraceEvents(result, prompt);
  return createExecutionTraceEvidenceBundle({
    events,
    buildRunId: result.buildId,
    projectId: result.projectId,
  });
}
