/**
 * Autonomous Testing — coverage model builder.
 */

import type {
  AutonomousTestCategory,
  AutonomousTestCoverageModel,
  AutonomousTestPlanInput,
} from './autonomous-testing-types.js';

export function buildAutonomousTestCoverageModel(
  input: AutonomousTestPlanInput,
  categories: AutonomousTestCategory[],
): AutonomousTestCoverageModel {
  const coverageTargets: string[] = ['touched subsystem coverage', 'regression coverage'];
  const missingCoverage: string[] = [];

  if (input.brainChanged || categories.includes('BRAIN')) {
    coverageTargets.push('brain routing coverage');
  }
  if (input.routingChanged || categories.includes('ROUTING')) {
    coverageTargets.push('routing canonicalization coverage');
  }
  if (input.uiChanged || categories.includes('UI')) {
    coverageTargets.push('surface visibility coverage');
  }
  if (categories.includes('TRUST') || input.trustChanged) {
    coverageTargets.push('trust policy coverage');
  }
  if (categories.includes('VERIFICATION') || input.verificationSystemChanged) {
    coverageTargets.push('verification planning coverage');
  }
  if (categories.includes('WORLD2') || input.world2ExecutionActive) {
    coverageTargets.push('World 2 safety coverage');
  }
  if (categories.includes('CLOUD') || input.cloudRuntimeTouched) {
    coverageTargets.push('cloud safety coverage');
  }
  if (categories.includes('BUILD') || input.buildStrategyChanged) {
    coverageTargets.push('build strategy coverage');
  }
  coverageTargets.push('runtime safety coverage');

  const expectedCategories: AutonomousTestCategory[] = ['UNIT', 'REGRESSION'];
  if (input.brainChanged) expectedCategories.push('BRAIN');
  if (input.routingChanged) expectedCategories.push('ROUTING');
  if (input.uiChanged) expectedCategories.push('UI');
  if (input.world2ExecutionActive) expectedCategories.push('WORLD2');
  if (input.cloudRuntimeTouched) expectedCategories.push('CLOUD');

  for (const cat of expectedCategories) {
    if (!categories.includes(cat)) {
      missingCoverage.push(`missing ${cat} category coverage`);
    }
  }

  const covered = [...new Set(categories)];
  const coverageScore = Math.round(
    (covered.length / Math.max(covered.length + missingCoverage.length, 1)) * 100,
  );

  return {
    coverageTargets: [...new Set(coverageTargets)],
    coveredCategories: covered,
    missingCoverage,
    coverageScore,
  };
}
