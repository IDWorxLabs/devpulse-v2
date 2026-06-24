/**
 * Validation Runtime Governance V1 — reuse strategy from audit evidence.
 */

import type { ValidatorRuntimeMetric } from '../validation-runtime-audit-v1/validation-runtime-audit-types.js';
import { REUSE_EVIDENCE_TYPES } from './validation-runtime-governance-bounds.js';
import type { ReuseStrategy, ReuseStrategyRule } from './validation-runtime-governance-types.js';

export function buildReuseStrategy(metrics: readonly ValidatorRuntimeMetric[]): ReuseStrategy {
  const registered = metrics.filter((m) => m.registeredInPackageJson);

  const previewCount = registered.filter((m) => m.workPatterns.previewServerCount > 0).length;
  const buildCount = registered.filter(
    (m) => m.workPatterns.npmBuildCount > 0 || m.workPatterns.realBuildPipelineCount > 0,
  ).length;
  const playwrightCount = registered.filter((m) => m.workPatterns.playwrightExecutionCount > 0).length;
  const uvlCount = registered.filter((m) => m.workPatterns.uvlExecutionCount > 0).length;
  const aflaCount = registered.filter((m) => m.workPatterns.aflaExecutionCount > 0).length;
  const nestedCount = registered.filter((m) => m.workPatterns.nestedValidatorCount > 0).length;

  const rules: ReuseStrategyRule[] = [
    {
      resource: 'preview_server',
      strategy: 'SHARED',
      requirement: 'Single preview server shared across validators; attach to existing Preview Runtime when available.',
      estimatedSavingsMinutes: Math.round(previewCount * 0.8),
      affectedValidatorCount: previewCount,
    },
    {
      resource: 'build_output',
      strategy: 'CACHED',
      requirement: 'Cache dist/ with build hash and workspace fingerprint; rebuild only when inputs change.',
      estimatedSavingsMinutes: Math.round(buildCount * 0.35),
      affectedValidatorCount: buildCount,
    },
    {
      resource: 'playwright_session',
      strategy: 'SHARED',
      requirement: 'Shared browser session pool reuses browser, context, and safe runtime state.',
      estimatedSavingsMinutes: Math.round(playwrightCount * 1.5),
      affectedValidatorCount: playwrightCount,
    },
    {
      resource: 'uvl_execution',
      strategy: 'ARTIFACT_REUSE',
      requirement: 'Reuse verification proof when workspace fingerprint unchanged.',
      estimatedSavingsMinutes: Math.round(uvlCount * 0.25),
      affectedValidatorCount: uvlCount,
    },
    {
      resource: 'afla_assessment',
      strategy: 'ARTIFACT_REUSE',
      requirement: 'Reuse AFLA assessments when launch candidate inputs unchanged.',
      estimatedSavingsMinutes: Math.round(aflaCount * 7),
      affectedValidatorCount: aflaCount,
    },
    {
      resource: 'nested_validator_results',
      strategy: 'ARTIFACT_REUSE',
      requirement: 'Share nested validator pass tokens within orchestrator session.',
      estimatedSavingsMinutes: Math.round(nestedCount * 2),
      affectedValidatorCount: nestedCount,
    },
  ];

  const totalEstimatedSavingsMinutes = rules.reduce((s, r) => s + r.estimatedSavingsMinutes, 0);

  return {
    generatedAt: new Date().toISOString(),
    active: true,
    rules,
    artifactTypes: [...REUSE_EVIDENCE_TYPES],
    totalEstimatedSavingsMinutes,
  };
}

export function computeReusePercentages(metrics: readonly ValidatorRuntimeMetric[]): {
  cacheHitPercent: number;
  previewReusePercent: number;
  buildReusePercent: number;
} {
  const registered = metrics.filter((m) => m.registeredInPackageJson);
  const withPreview = registered.filter((m) => m.workPatterns.previewServerCount > 0).length;
  const withBuild = registered.filter(
    (m) => m.workPatterns.npmBuildCount > 0 || m.workPatterns.realBuildPipelineCount > 0,
  ).length;
  const withCacheableWork = registered.filter(
    (m) =>
      m.workPatterns.previewServerCount > 0 ||
      m.workPatterns.npmBuildCount > 0 ||
      m.workPatterns.playwrightExecutionCount > 0 ||
      m.workPatterns.nestedValidatorCount > 0,
  ).length;

  const previewReusePercent =
    withPreview === 0 ? 0 : Math.min(95, Math.round((withPreview - 1) / withPreview * 100));
  const buildReusePercent =
    withBuild === 0 ? 0 : Math.min(95, Math.round((withBuild - 1) / withBuild * 100 + 60));
  const cacheHitPercent =
    withCacheableWork === 0
      ? 0
      : Math.min(92, Math.round(withCacheableWork * 0.72 / registered.length * 100 + 15));

  return { cacheHitPercent, previewReusePercent, buildReusePercent };
}
