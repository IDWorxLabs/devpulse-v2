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
    technicalDetail: 'Profile-specific feature modules and DomainAppFeature UI materialized.',
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
    step = 1;
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
        stepTotal: total + evidenceStages.length,
      });
      step += 1;
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
