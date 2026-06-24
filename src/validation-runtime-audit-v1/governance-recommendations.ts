/**
 * Validation Runtime Audit V1 — evidence-only governance recommendations.
 */

import type {
  DependencyGraph,
  GovernanceRecommendation,
  ValidatorRuntimeMetric,
} from './validation-runtime-audit-types.js';

export function buildGovernanceRecommendations(input: {
  metrics: readonly ValidatorRuntimeMetric[];
  dependencyGraph: DependencyGraph;
}): readonly GovernanceRecommendation[] {
  const recs: GovernanceRecommendation[] = [];

  const buildHeavy = input.metrics.filter(
    (m) => m.workPatterns.npmBuildCount >= 2 || m.workPatterns.realBuildPipelineCount > 0,
  );
  if (buildHeavy.length >= 2) {
    recs.push({
      action: 'CACHE',
      target: 'build outputs across validators',
      rationale: `${buildHeavy.length} validators trigger npm build or real-build pipeline work; measured RBEP runs 65s+ per invocation.`,
      evidenceValidators: buildHeavy.slice(0, 8).map((m) => m.validatorName),
      estimatedSavingsMinutes: Math.round(buildHeavy.reduce((s, m) => s + m.runtimeMinutes, 0) * 0.4),
    });
  }

  const previewHeavy = input.metrics.filter((m) => m.workPatterns.previewServerCount >= 1);
  if (previewHeavy.length >= 3) {
    recs.push({
      action: 'REUSE',
      target: 'preview servers across validators',
      rationale: `${previewHeavy.length} validators start preview servers independently.`,
      evidenceValidators: previewHeavy.slice(0, 8).map((m) => m.validatorName),
      estimatedSavingsMinutes: Math.round(previewHeavy.length * 0.8),
    });
  }

  const uvlHeavy = input.metrics.filter((m) => m.workPatterns.uvlExecutionCount > 0);
  if (uvlHeavy.length >= 2) {
    recs.push({
      action: 'MERGE',
      target: 'UVL verification paths',
      rationale: 'Multiple validators invoke UVL verification execution with overlapping workspace checks.',
      evidenceValidators: uvlHeavy.map((m) => m.validatorName),
      estimatedSavingsMinutes: Math.round(uvlHeavy.reduce((s, m) => s + m.runtimeMinutes, 0) * 0.25),
    });
  }

  const aflaHeavy = input.metrics.filter(
    (m) => m.validatorName.includes('afla') || m.workPatterns.aflaExecutionCount > 0,
  );
  const aflaMeasured = aflaHeavy.find((m) => m.validatorName === 'validate:autonomous-founder-launch-authority-v1');
  if (aflaHeavy.length >= 2 || (aflaMeasured && aflaMeasured.runtimeMinutes >= 5)) {
    recs.push({
      action: 'TIER',
      target: 'AFLA validation to launch-only gate',
      rationale: `AFLA validators measured up to ${aflaMeasured?.runtimeMinutes ?? 7} min; should not run on every feature phase.`,
      evidenceValidators: aflaHeavy.slice(0, 6).map((m) => m.validatorName),
      estimatedSavingsMinutes: aflaMeasured?.runtimeMinutes ?? 7,
    });
  }

  const highDup = input.metrics
    .filter((m) => m.duplicateWorkPercent >= 50)
    .sort((a, b) => b.duplicateWorkPercent - a.duplicateWorkPercent);
  if (highDup.length >= 3) {
    recs.push({
      action: 'MERGE',
      target: 'high-duplicate regression validators',
      rationale: `${highDup.length} validators show ≥50% duplicate work overlap within their category.`,
      evidenceValidators: highDup.slice(0, 10).map((m) => m.validatorName),
      estimatedSavingsMinutes: Math.round(highDup.slice(0, 5).reduce((s, m) => s + m.runtimeMinutes, 0) * 0.3),
    });
  }

  const nested = input.dependencyGraph.nodes.filter((n) => n.nestedValidation && n.triggers.length >= 2);
  if (nested.length > 0) {
    recs.push({
      action: 'REUSE',
      target: 'nested validator results',
      rationale: `${nested.length} validators trigger multiple child validators; results could be shared.`,
      evidenceValidators: nested.slice(0, 8).map((n) => n.validatorName),
      estimatedSavingsMinutes: Math.round(nested.length * 2),
    });
  }

  if (input.dependencyGraph.circularValidationPaths.length > 0) {
    recs.push({
      action: 'REMOVE',
      target: 'circular validation paths',
      rationale: `Detected ${input.dependencyGraph.circularValidationPaths.length} circular validation path(s).`,
      evidenceValidators: input.dependencyGraph.circularValidationPaths.slice(0, 3),
      estimatedSavingsMinutes: 0,
    });
  }

  const launchOnly = input.metrics.filter(
    (m) =>
      m.category === 'LAUNCH' ||
      m.category === 'AFLA' ||
      m.validatorName.includes('launch-authority'),
  );
  if (launchOnly.length >= 2) {
    recs.push({
      action: 'TIER',
      target: 'launch-only validation',
      rationale: 'Launch and AFLA validators are expensive and should not block routine feature phases.',
      evidenceValidators: launchOnly.slice(0, 6).map((m) => m.validatorName),
      estimatedSavingsMinutes: Math.round(launchOnly.reduce((s, m) => s + m.runtimeMinutes, 0) * 0.7),
    });
  }

  const playwrightHeavy = input.metrics.filter((m) => m.workPatterns.playwrightExecutionCount >= 1);
  if (playwrightHeavy.length >= 2) {
    recs.push({
      action: 'CACHE',
      target: 'Playwright browser sessions',
      rationale: `${playwrightHeavy.length} validators launch Playwright; session reuse would reduce cold-start cost.`,
      evidenceValidators: playwrightHeavy.slice(0, 6).map((m) => m.validatorName),
      estimatedSavingsMinutes: Math.round(playwrightHeavy.length * 1.5),
    });
  }

  const lowCost = input.metrics.filter((m) => m.costTier === 'LOW' && m.registeredInPackageJson);
  if (lowCost.length > 20) {
    recs.push({
      action: 'KEEP',
      target: 'fast validators as always-on regression',
      rationale: `${lowCost.length} registered validators are LOW tier (<30s estimated); safe for continuous regression.`,
      evidenceValidators: lowCost.slice(0, 5).map((m) => m.validatorName),
      estimatedSavingsMinutes: 0,
    });
  }

  return recs;
}
