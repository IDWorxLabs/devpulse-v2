/**
 * Build Execution Stabilizer V1 — timeout policy.
 *
 * Configurable per-stage stall/total timeout thresholds. No stage may run forever — every stage
 * has a hard cap, and a shorter "no activity" window that trips a stall before the hard cap does.
 */

import type { BuildExecutionStageName, BuildExecutionStageStallConfig } from './build-execution-types.js';

export const DEFAULT_STAGE_STALL_CONFIG: Record<BuildExecutionStageName, BuildExecutionStageStallConfig> = {
  PLANNING: { stallTimeoutMs: 15_000, totalTimeoutMs: 30_000 },
  GENERATION: { stallTimeoutMs: 30_000, totalTimeoutMs: 90_000 },
  WORKSPACE_STABILIZATION: { stallTimeoutMs: 10_000, totalTimeoutMs: 15_000 },
  NPM_INSTALL: { stallTimeoutMs: 90_000, totalTimeoutMs: 180_000 },
  NPM_BUILD: { stallTimeoutMs: 60_000, totalTimeoutMs: 120_000 },
  PREVIEW_STARTUP: { stallTimeoutMs: 20_000, totalTimeoutMs: 40_000 },
  INTERACTION_PROOF: { stallTimeoutMs: 30_000, totalTimeoutMs: 30_000 },
  VALIDATION: { stallTimeoutMs: 15_000, totalTimeoutMs: 20_000 },
  RESULT: { stallTimeoutMs: 5_000, totalTimeoutMs: 5_000 },
};

export const STAGE_LABELS: Record<BuildExecutionStageName, string> = {
  PLANNING: 'Planning',
  GENERATION: 'Generating your app',
  WORKSPACE_STABILIZATION: 'Verifying the generated workspace',
  NPM_INSTALL: 'Installing dependencies',
  NPM_BUILD: 'Compiling your app',
  PREVIEW_STARTUP: 'Starting the live preview',
  INTERACTION_PROOF: 'Testing the app in the live preview',
  VALIDATION: 'Running final checks',
  RESULT: 'Finishing up',
};

export function resolveStageConfig(
  stage: BuildExecutionStageName,
  overrides?: Partial<BuildExecutionStageStallConfig>,
): BuildExecutionStageStallConfig {
  const base = DEFAULT_STAGE_STALL_CONFIG[stage];
  return {
    stallTimeoutMs: overrides?.stallTimeoutMs ?? base.stallTimeoutMs,
    totalTimeoutMs: overrides?.totalTimeoutMs ?? base.totalTimeoutMs,
  };
}
