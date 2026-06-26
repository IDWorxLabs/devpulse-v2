/**
 * Production Validation V1 — execution trace runtime evidence events.
 */

import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';
import type { ProductionValidationEvidence } from './production-validation-types.js';

const PRODUCTION_TRACE_STAGES: Array<{
  title: string;
  component: string;
  when: (evidence: ProductionValidationEvidence) => boolean;
  detail: (evidence: ProductionValidationEvidence) => string;
  status: (evidence: ProductionValidationEvidence) => ExecutionTraceEvent['status'];
}> = [
  {
    title: 'Production validation started',
    component: 'production_validation',
    when: () => true,
    detail: (e) => `Profile ${e.profileId} — full install/build/preview chain`,
    status: () => 'Active',
  },
  {
    title: 'Workspace generated',
    component: 'materialization_engine',
    when: (e) => e.generateStatus === 'PASS',
    detail: (e) => `${e.generatedFilesCount} files — ${e.workspaceDir}`,
    status: () => 'Completed',
  },
  {
    title: 'Dependency readiness verified',
    component: 'npm_install',
    when: (e) => e.installStatus === 'PASS',
    detail: () => 'npm install --ignore-scripts completed',
    status: () => 'PASS',
  },
  {
    title: 'Build started',
    component: 'npm_build',
    when: (e) => e.buildStatus === 'PASS' || e.previewStatus !== 'SKIP',
    detail: () => 'npm run build invoked for generated workspace',
    status: (e) => (e.buildStatus === 'PASS' ? 'Completed' : 'Blocked'),
  },
  {
    title: 'Build passed',
    component: 'npm_build',
    when: (e) => e.buildStatus === 'PASS',
    detail: () => 'dist/index.html produced',
    status: () => 'PASS',
  },
  {
    title: 'Preview started',
    component: 'live_preview_runtime',
    when: (e) => e.previewStatus === 'PASS',
    detail: (e) => e.previewUrl ?? 'preview URL resolved',
    status: () => 'Completed',
  },
  {
    title: 'Preview HTML fetched',
    component: 'live_preview_runtime',
    when: (e) => e.previewHtmlStatus === 'PASS',
    detail: () => 'HTTP 200 — SPA shell HTML retrieved from Vite dev server',
    status: () => 'PASS',
  },
  {
    title: 'App shell verified',
    component: 'blueprint_materializer',
    when: (e) => e.blueprintValidationStatus === 'PASS',
    detail: () => 'Universal App Blueprint shell artifacts present in workspace',
    status: () => 'PASS',
  },
  {
    title: 'Feature router verified',
    component: 'modular_feature_materializer',
    when: (e) => e.modularRoutesVerified,
    detail: () => 'FeatureAppRouter wired through registry and routes.ts',
    status: () => 'PASS',
  },
  {
    title: 'Profile-specific UI verified',
    component: 'materialization_validator',
    when: (e) => e.profileSpecificUiVerified,
    detail: (e) => `Profile ${e.profileId} — prompt terms and module folders aligned`,
    status: () => 'PASS',
  },
  {
    title: 'Blueprint validation passed',
    component: 'blueprint_materializer',
    when: (e) => e.blueprintValidationStatus === 'PASS',
    detail: () => 'inspectUniversalAppBlueprint — all required sections',
    status: () => 'PASS',
  },
  {
    title: 'Feature contract validation passed',
    component: 'feature_contract',
    when: (e) => e.featureContractValidationStatus === 'PASS',
    detail: () => 'universal-feature-contract.json entities and actions present',
    status: () => 'PASS',
  },
  {
    title: 'Prompt alignment passed',
    component: 'materialization_validator',
    when: (e) => e.promptAlignmentStatus === 'PASS',
    detail: () => 'validateUniversalAppMaterialization — profile-specific terms detected',
    status: () => 'PASS',
  },
  {
    title: 'Production validation passed',
    component: 'production_validation',
    when: (e) => e.productionValidationStatus === 'PASS',
    detail: (e) => `${e.durationMs}ms — install, build, preview, and validation chain complete`,
    status: () => 'PASS',
  },
  {
    title: 'Preview stopped',
    component: 'live_preview_runtime',
    when: (e) => e.cleanupStatus === 'PASS',
    detail: () => 'Vite dev server process tree terminated',
    status: () => 'Completed',
  },
];

export function buildProductionValidationTraceEvents(
  evidence: ProductionValidationEvidence,
  buildId: string,
): ExecutionTraceEvent[] {
  const ts = Date.parse(evidence.validatedAt) || Date.now();
  const total = PRODUCTION_TRACE_STAGES.length;
  let step = 0;

  return PRODUCTION_TRACE_STAGES.map((stage) => {
    step += 1;
    const matched = stage.when(evidence);
    const severity =
      evidence.productionValidationStatus === 'FAIL' && !matched && stage.title.includes('passed')
        ? 'ERROR'
        : matched
          ? 'INFO'
          : 'WARN';

    return {
      eventId: `${buildId}-prod-trace-${step}`,
      timestamp: ts + step,
      runtimeStage: 'Validation',
      component: stage.component,
      severity,
      eventTitle: stage.title,
      technicalDetail: matched ? stage.detail(evidence) : `${stage.title} — not reached`,
      evidence: evidence.workspaceDir,
      artifactLinks: evidence.previewUrl ? [evidence.previewUrl] : undefined,
      durationMs: evidence.stages.find((s) => s.stage === stage.title.toLowerCase())?.durationMs,
      status: matched ? stage.status(evidence) : 'Blocked',
      metadata: {
        milestone: true,
        category: 'runtime',
        profileId: evidence.profileId,
        productionValidation: true,
      },
      informationalOnly: true,
      section: 'Validation',
      action: stage.title,
      detail: stage.detail(evidence),
      stepIndex: step,
      stepTotal: total,
    };
  });
}

export function productionValidationTraceTitles(): string[] {
  return PRODUCTION_TRACE_STAGES.map((stage) => stage.title);
}
