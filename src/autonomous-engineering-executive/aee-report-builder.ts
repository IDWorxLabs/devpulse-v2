/**
 * Autonomous Engineering Executive V1 — final report builder.
 */

import { listWorkspaceFeatureModuleIds } from '../prompt-faithful-generation/index.js';
import type {
  AeeBuildOutcome,
  AeeDecision,
  AeeExecutiveDecisionResult,
  AeeFinalReport,
  AeeStage,
} from './aee-types.js';

export interface BuildAeeFinalReportInput {
  projectName: string;
  selectedProfile: string;
  workspacePath: string;
  workspaceDir?: string;
  generatedModules?: readonly string[];
  executiveDecision: AeeExecutiveDecisionResult;
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  previewOk: boolean;
  previewDegraded: boolean;
  livePreviewUrl: string | null;
  remainingGaps?: readonly string[];
  outcome?: AeeBuildOutcome | null;
  buildAutofixReport?: import('./aee-build-autofix-loop-types.js').AeeBuildAutofixReport | null;
  previewContractSummary?: string | null;
  engineeringIntelligenceReport?: import('../engineering-intelligence-runtime/index.js').EngineeringIntelligenceReport | null;
}

export function buildAeeFinalReport(input: BuildAeeFinalReportInput): AeeFinalReport {
  const generatedModules =
    input.generatedModules ??
    (input.workspaceDir ? listWorkspaceFeatureModuleIds(input.workspaceDir) : []);
  const evidenceProviders = [...new Set(input.executiveDecision.evidence.map((e) => e.authority))];

  const preInstallStages: readonly AeeStage[] = [
    'PROMPT_RECEIVED',
    'UNDERSTOOD',
    'PLANNING',
    'GENERATING',
    'WORKSPACE_READY',
  ];

  const npmInstallResult: AeeFinalReport['npmInstallResult'] = input.npmInstallOk
    ? 'PASS'
    : preInstallStages.includes(input.executiveDecision.furthestStageReached)
      ? 'PENDING'
      : 'FAIL';

  const npmBuildResult: AeeFinalReport['npmBuildResult'] = input.npmBuildOk
    ? 'PASS'
    : npmInstallResult === 'PASS'
      ? 'FAIL'
      : 'PENDING';

  const previewResult: AeeFinalReport['previewResult'] = input.previewOk
    ? 'PASS'
    : input.previewDegraded
      ? 'DEGRADED'
      : npmBuildResult === 'PASS'
        ? 'FAIL'
        : 'PENDING';

  const overrideEvents = input.executiveDecision.overrideEvent
    ? [input.executiveDecision.overrideEvent]
    : [];

  return {
    readOnly: true,
    projectName: input.projectName,
    selectedProfile: input.selectedProfile,
    generatedModules,
    workspacePath: input.workspacePath,
    buildSpineStageReached: input.executiveDecision.furthestStageReached,
    finalDecision: input.executiveDecision.decision,
    finalOutcome: input.outcome ?? input.executiveDecision.outcome,
    evidenceProvidersConsulted: evidenceProviders,
    blockersOverridden: input.executiveDecision.overriddenBlockers,
    blockersRespected: input.executiveDecision.respectedBlockers,
    repairAttempts: input.executiveDecision.repairAttempts,
    retryAttempts: input.executiveDecision.retryAttempts,
    previewRecoveryAttempts: input.executiveDecision.previewRecoveryAttempts,
    npmInstallResult,
    npmBuildResult,
    previewResult,
    livePreviewUrl: input.livePreviewUrl,
    remainingGaps: input.remainingGaps ?? [],
    buildAutofixReport: input.buildAutofixReport ?? null,
    previewContractSummary: input.previewContractSummary ?? null,
    engineeringIntelligenceReport: input.engineeringIntelligenceReport ?? null,
    overrideEvents,
    recordedAt: new Date().toISOString(),
  };
}

export function formatAeeFinalReportMarkdown(report: AeeFinalReport): string {
  const lines = [
    '# Autonomous Engineering Executive — Final Report',
    '',
    `- **Project:** ${report.projectName}`,
    `- **Profile:** ${report.selectedProfile}`,
    `- **Workspace:** ${report.workspacePath}`,
    `- **Build spine stage reached:** ${report.buildSpineStageReached}`,
    `- **AEE final decision:** ${report.finalDecision}`,
    `- **Build outcome:** ${report.finalOutcome ?? 'in progress'}`,
    '',
    '## Generated modules',
    ...(report.generatedModules.length ? report.generatedModules.map((m) => `- ${m}`) : ['- none']),
    '',
    '## Evidence providers consulted',
    ...report.evidenceProvidersConsulted.map((p) => `- ${p}`),
    '',
    '## Blockers overridden',
    ...(report.blockersOverridden.length
      ? report.blockersOverridden.map((b) => `- ${b}`)
      : ['- none']),
    '',
    '## Blockers respected',
    ...(report.blockersRespected.length ? report.blockersRespected.map((b) => `- ${b}`) : ['- none']),
    '',
    '## Build spine results',
    `- npm install: ${report.npmInstallResult}`,
    `- npm build: ${report.npmBuildResult}`,
    `- preview: ${report.previewResult}`,
    `- repair attempts: ${report.repairAttempts}`,
    `- retry attempts: ${report.retryAttempts}`,
    ...(report.livePreviewUrl ? [`- live preview URL: ${report.livePreviewUrl}`] : []),
    '',
    ...(report.buildAutofixReport
      ? [
          '## Build AutoFix',
          `- npm build initial: ${report.buildAutofixReport.npmBuildInitialResult}`,
          `- failure class: ${report.buildAutofixReport.initialFailureClass}`,
          `- AutoFix attempts: ${report.buildAutofixReport.autofixAttempts.length}`,
          `- files changed: ${report.buildAutofixReport.filesChanged.join(', ') || 'none'}`,
          `- final build status: ${report.buildAutofixReport.finalBuildStatus}`,
          `- remaining errors: ${report.buildAutofixReport.remainingErrors.join('; ') || 'none'}`,
          '',
        ]
      : []),
    ...(report.previewContractSummary
      ? ['', '## Preview contract', `- ${report.previewContractSummary}`]
      : []),
    '## Remaining gaps',
    ...(report.remainingGaps.length ? report.remainingGaps.map((g) => `- ${g}`) : ['- none']),
  ];
  if (report.overrideEvents.length) {
    lines.push('', '## Override events', ...report.overrideEvents.map((e) => `- ${e}`));
  }
  return lines.join('\n');
}

export function resolveAeeFailureStageLabel(input: {
  proposedStage: string;
  furthestStageReached: AeeStage;
  hasGeneratedSource: boolean;
  decision: AeeDecision;
}): string {
  if (input.hasGeneratedSource && /planning/i.test(input.proposedStage)) {
    return 'MATERIALIZATION';
  }
  return input.proposedStage;
}
