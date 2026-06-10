/**
 * Autonomous Testing — depth and category selection.
 */

import type {
  AutonomousTestCategory,
  AutonomousTestDepth,
  AutonomousTestPlanInput,
} from './autonomous-testing-types.js';

export function selectAutonomousTestDepth(
  input: AutonomousTestPlanInput,
  riskScore: number,
): { depth: AutonomousTestDepth; reasoning: string[] } {
  const reasoning: string[] = [];

  if (
    input.repeatFailuresDetected ||
    input.verificationDisagreement ||
    input.verificationStrategy === 'TRUST_RECOVERY' ||
    input.verificationPlanType === 'TRUST_RECOVERY' ||
    input.verificationReadiness === 'TRUST_RECOVERY_REQUIRED'
  ) {
    reasoning.push('Trust recovery conditions require TRUST_RECOVERY test depth');
    return { depth: 'TRUST_RECOVERY', reasoning };
  }

  if (
    input.world2ExecutionActive ||
    input.executionMode === 'WORLD2' ||
    input.executionMode === 'AUTONOMOUS' ||
    (input.subsystemTouched ?? []).some((s) => s.toLowerCase().includes('world2'))
  ) {
    reasoning.push('World 2 or autonomous execution requires WORLD2 test depth');
    return { depth: 'WORLD2', reasoning };
  }

  if (
    input.cloudRuntimeTouched ||
    input.executionMode === 'CLOUD' ||
    input.executionMode === 'REMOTE' ||
    input.executionMode === 'API' ||
    input.verificationPlanType === 'CLOUD'
  ) {
    reasoning.push('Cloud or remote execution requires CLOUD test depth');
    return { depth: 'CLOUD', reasoning };
  }

  if (input.releaseReady || input.verificationPlanType === 'RELEASE') {
    reasoning.push('Release candidate requires RELEASE test depth');
    return { depth: 'RELEASE', reasoning };
  }

  if (
    input.brainChanged ||
    input.routingChanged ||
    input.dataModelChanged ||
    input.changeScope === 'MAJOR' ||
    input.changeScope === 'LARGE' ||
    input.verificationPlanType === 'DEEP' ||
    riskScore >= 65
  ) {
    reasoning.push('Architecture, brain, routing, or high risk requires DEEP test depth');
    return { depth: 'DEEP', reasoning };
  }

  if (
    input.changeScope === 'TINY' ||
    input.executionMode === 'NONE' ||
    input.verificationStrategy === 'MINIMAL' ||
    input.verificationPlanType === 'QUICK'
  ) {
    reasoning.push('Read-only or planning-only work requires SMOKE test depth');
    return { depth: 'SMOKE', reasoning };
  }

  reasoning.push('Normal feature work requires STANDARD test depth');
  return { depth: 'STANDARD', reasoning };
}

export function selectAutonomousTestCategories(input: AutonomousTestPlanInput): AutonomousTestCategory[] {
  const categories = new Set<AutonomousTestCategory>(['UNIT', 'REGRESSION']);

  if (input.uiChanged) {
    categories.add('UI');
    categories.add('RUNTIME');
  }
  if (input.brainChanged) {
    categories.add('BRAIN');
    categories.add('INTEGRATION');
    categories.add('TRUST');
  }
  if (input.routingChanged) {
    categories.add('ROUTING');
    categories.add('RUNTIME');
    categories.add('INTEGRATION');
  }
  if (input.world2ExecutionActive || (input.subsystemTouched ?? []).some((s) => s.includes('world2'))) {
    categories.add('WORLD2');
    categories.add('BUILD');
    categories.add('TRUST');
    categories.add('VERIFICATION');
  }
  if (input.cloudRuntimeTouched) {
    categories.add('CLOUD');
    categories.add('RUNTIME');
    categories.add('INTEGRATION');
    categories.add('VERIFICATION');
  }
  if (input.trustChanged || input.trustScore < 60) {
    categories.add('TRUST');
    categories.add('BRAIN');
    categories.add('VERIFICATION');
  }
  if (input.buildStrategyChanged) {
    categories.add('BUILD');
    categories.add('BRAIN');
    categories.add('VERIFICATION');
  }
  if (input.verificationSystemChanged) {
    categories.add('VERIFICATION');
    categories.add('TRUST');
    categories.add('RUNTIME');
  }

  if (categories.size <= 2) {
    categories.add('INTEGRATION');
    categories.add('RUNTIME');
  }

  return [...categories];
}
