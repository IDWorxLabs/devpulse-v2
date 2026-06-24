/**
 * Validation Runtime Audit V1 — runtime estimation from patterns and measured baselines.
 */

import { MEASURED_RUNTIME_BASELINES } from './validation-runtime-audit-bounds.js';
import type {
  MeasurementSource,
  RuntimeCostTier,
  WorkPatternCounts,
} from './validation-runtime-audit-types.js';

const PATTERN_WEIGHT_SECONDS = {
  npmInstall: 45,
  npmBuild: 35,
  previewServer: 12,
  playwright: 90,
  workspaceMaterialization: 25,
  uvlExecution: 40,
  aflaExecution: 120,
  auditExecution: 5,
  realBuildPipeline: 60,
  nestedValidator: 30,
  fileChecksOnly: 3,
} as const;

export function estimateRuntimeSeconds(input: {
  validatorName: string;
  workPatterns: WorkPatternCounts;
  maxRuntimeBoundMs: number | null;
}): { runtimeSeconds: number; measurementSource: MeasurementSource } {
  const measured = MEASURED_RUNTIME_BASELINES[input.validatorName];
  if (measured !== undefined) {
    return { runtimeSeconds: measured, measurementSource: 'MEASURED' };
  }

  if (input.maxRuntimeBoundMs !== null && input.maxRuntimeBoundMs >= 300_000) {
    const boundSeconds = input.maxRuntimeBoundMs / 1000;
    const patternEstimate = estimateFromPatterns(input.workPatterns);
    return {
      runtimeSeconds: Math.min(boundSeconds, Math.max(patternEstimate, boundSeconds * 0.35)),
      measurementSource: 'MAX_RUNTIME_BOUND',
    };
  }

  return {
    runtimeSeconds: estimateFromPatterns(input.workPatterns),
    measurementSource: 'STATIC_ESTIMATE',
  };
}

function estimateFromPatterns(patterns: WorkPatternCounts): number {
  let seconds = PATTERN_WEIGHT_SECONDS.fileChecksOnly;

  seconds += patterns.npmInstallCount * PATTERN_WEIGHT_SECONDS.npmInstall;
  seconds += patterns.npmBuildCount * PATTERN_WEIGHT_SECONDS.npmBuild;
  seconds += patterns.previewServerCount * PATTERN_WEIGHT_SECONDS.previewServer;
  seconds += patterns.playwrightExecutionCount * PATTERN_WEIGHT_SECONDS.playwright;
  seconds += patterns.workspaceMaterializationCount * PATTERN_WEIGHT_SECONDS.workspaceMaterialization;
  seconds += patterns.uvlExecutionCount * PATTERN_WEIGHT_SECONDS.uvlExecution;
  seconds += patterns.aflaExecutionCount * PATTERN_WEIGHT_SECONDS.aflaExecution;
  seconds += patterns.auditExecutionCount * PATTERN_WEIGHT_SECONDS.auditExecution;
  seconds += patterns.realBuildPipelineCount * PATTERN_WEIGHT_SECONDS.realBuildPipeline;
  seconds += patterns.nestedValidatorCount * PATTERN_WEIGHT_SECONDS.nestedValidator;

  return Math.round(seconds * 10) / 10;
}

export function classifyCostTier(runtimeSeconds: number, patterns: WorkPatternCounts): RuntimeCostTier {
  if (
    runtimeSeconds >= 300 ||
    patterns.realBuildPipelineCount > 0 ||
    patterns.playwrightExecutionCount >= 3 ||
    patterns.aflaExecutionCount >= 2
  ) {
    return 'CRITICAL';
  }
  if (runtimeSeconds >= 120 || patterns.npmBuildCount >= 3 || patterns.playwrightExecutionCount >= 1) {
    return 'HIGH';
  }
  if (runtimeSeconds >= 30 || patterns.npmInstallCount >= 1 || patterns.previewServerCount >= 1) {
    return 'MEDIUM';
  }
  return 'LOW';
}
