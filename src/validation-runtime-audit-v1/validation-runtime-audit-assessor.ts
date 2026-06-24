/**
 * Validation Runtime Audit V1 — main assessor (read-only, measurement only).
 */

import { buildBottleneckReport } from './bottleneck-analyzer.js';
import { buildDependencyGraph } from './dependency-graph-builder.js';
import { buildDuplicateWorkAnalysis } from './duplicate-work-analyzer.js';
import { buildGovernanceRecommendations } from './governance-recommendations.js';
import { buildRegressionChainAnalysis } from './regression-chain-analyzer.js';
import { classifyCostTier, estimateRuntimeSeconds } from './runtime-estimator.js';
import {
  VALIDATION_RUNTIME_AUDIT_V1_PASS_TOKEN,
} from './validation-runtime-audit-bounds.js';
import type {
  DependencyGraph,
  GovernanceRecommendation,
  ValidatorRankingEntry,
  ValidationRuntimeAuditAssessment,
  ValidatorRuntimeMetric,
} from './validation-runtime-audit-types.js';
import { buildValidatorRegistry } from './validator-registry.js';
import {
  analyzeWorkPatterns,
  classifyValidatorCategory,
  detectValidationMode,
  extractMaxRuntimeBoundMs,
  readValidatorScriptContent,
} from './validator-static-analyzer.js';

export interface ValidationRuntimeAuditResult {
  assessment: ValidationRuntimeAuditAssessment;
  rankings: {
    slowest: readonly ValidatorRankingEntry[];
    mostExpensive: readonly ValidatorRankingEntry[];
    highestDuplicate: readonly ValidatorRankingEntry[];
  };
  duplicateWork: ReturnType<typeof buildDuplicateWorkAnalysis>;
  dependencyGraph: DependencyGraph;
  bottlenecks: ReturnType<typeof buildBottleneckReport>;
  governanceRecommendations: readonly GovernanceRecommendation[];
}

function toRankingEntry(metric: ValidatorRuntimeMetric, rank: number): ValidatorRankingEntry {
  return {
    rank,
    validatorName: metric.validatorName,
    runtimeSeconds: metric.runtimeSeconds,
    runtimeMinutes: metric.runtimeMinutes,
    costTier: metric.costTier,
    duplicateWorkPercent: metric.duplicateWorkPercent,
    category: metric.category,
  };
}

function buildRankings(metrics: readonly ValidatorRuntimeMetric[]): ValidationRuntimeAuditResult['rankings'] {
  const registered = metrics.filter((m) => m.registeredInPackageJson);

  const slowest = [...registered]
    .sort((a, b) => b.runtimeSeconds - a.runtimeSeconds)
    .slice(0, 20)
    .map((m, i) => toRankingEntry(m, i + 1));

  const tierWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const mostExpensive = [...registered]
    .sort((a, b) => {
      const scoreA = tierWeight[a.costTier] * 100 + a.runtimeSeconds;
      const scoreB = tierWeight[b.costTier] * 100 + b.runtimeSeconds;
      return scoreB - scoreA;
    })
    .slice(0, 20)
    .map((m, i) => toRankingEntry(m, i + 1));

  const highestDuplicate = [...registered]
    .filter((m) => m.duplicateWorkPercent > 0)
    .sort((a, b) => b.duplicateWorkPercent - a.duplicateWorkPercent)
    .slice(0, 20)
    .map((m, i) => toRankingEntry(m, i + 1));

  return { slowest, mostExpensive, highestDuplicate };
}

export function buildValidationRuntimeAudit(projectRootDir: string): ValidationRuntimeAuditResult {
  const registry = buildValidatorRegistry(projectRootDir);
  const rawMetrics: ValidatorRuntimeMetric[] = [];

  for (const entry of registry) {
    const content = readValidatorScriptContent(entry.scriptPath);
    const workPatterns = analyzeWorkPatterns(content);
    const maxRuntimeBoundMs = extractMaxRuntimeBoundMs(content);
    const { runtimeSeconds, measurementSource } = estimateRuntimeSeconds({
      validatorName: entry.validatorName,
      workPatterns,
      maxRuntimeBoundMs,
    });
    const costTier = classifyCostTier(runtimeSeconds, workPatterns);

    rawMetrics.push({
      validatorName: entry.validatorName,
      scriptPath: entry.scriptPath,
      category: classifyValidatorCategory(entry.validatorName, entry.scriptFile),
      runtimeSeconds,
      runtimeMinutes: Math.round((runtimeSeconds / 60) * 100) / 100,
      measurementSource,
      costTier,
      duplicateWorkPercent: 0,
      workPatterns,
      maxRuntimeBoundMs,
      validationMode: detectValidationMode(content),
      registeredInPackageJson: entry.registeredInPackageJson,
    });
  }

  const duplicateWork = buildDuplicateWorkAnalysis(rawMetrics);
  const metrics = duplicateWork.metricsWithDuplicates;
  const dependencyGraph = buildDependencyGraph(registry);
  const bottlenecks = buildBottleneckReport(metrics);
  const governanceRecommendations = buildGovernanceRecommendations({ metrics, dependencyGraph });
  const regressionChain = buildRegressionChainAnalysis(metrics);
  const rankings = buildRankings(metrics);

  const registeredCount = metrics.filter((m) => m.registeredInPackageJson).length;
  const totalSeconds = metrics
    .filter((m) => m.registeredInPackageJson)
    .reduce((sum, m) => sum + m.runtimeSeconds, 0);

  const assessment: ValidationRuntimeAuditAssessment = {
    version: 'V1',
    generatedAt: new Date().toISOString(),
    passToken: VALIDATION_RUNTIME_AUDIT_V1_PASS_TOKEN,
    readOnly: true,
    measurementOnly: true,
    validatorCount: metrics.length,
    registeredValidatorCount: registeredCount,
    totalEstimatedRuntimeSeconds: Math.round(totalSeconds * 10) / 10,
    totalEstimatedRuntimeMinutes: Math.round((totalSeconds / 60) * 10) / 10,
    aggregateDuplicateWorkPercent: duplicateWork.aggregateDuplicateWorkPercent,
    metrics,
    regressionChain,
  };

  return {
    assessment,
    rankings,
    duplicateWork,
    dependencyGraph,
    bottlenecks,
    governanceRecommendations,
  };
}
