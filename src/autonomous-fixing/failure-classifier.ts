/**
 * Autonomous Fixing — failure classification.
 */

import type { FailureCategory, FixPlanInput } from './autonomous-fixing-types.js';

export function classifyFailure(input: FixPlanInput): FailureCategory {
  const signals = input.failureSignals.map((s) => s.toLowerCase()).join(' ');

  if (signals.includes('typecheck') || signals.includes('typescript')) return 'TYPECHECK';
  if (signals.includes('routing') || signals.includes('route') || signals.includes('canonical')) return 'ROUTING';
  if (signals.includes('brain') || signals.includes('capability selection')) return 'BRAIN';
  if (signals.includes('trust') || input.trustScore < 50) return 'TRUST';
  if (signals.includes('world2') || signals.includes('workspace') || input.world2Active) return 'WORLD2';
  if (signals.includes('cloud') || signals.includes('worker') || input.cloudTouched) return 'CLOUD';
  if (signals.includes('verification') || signals.includes('validator')) return 'VERIFICATION';
  if (signals.includes('test') || signals.includes('suite') || input.testResultStatus === 'SIMULATED_FAIL') return 'TEST';
  if (signals.includes('runtime') || signals.includes('startup')) return 'RUNTIME';
  if (signals.includes('build') || signals.includes('strategy')) return 'BUILD';

  return 'UNKNOWN';
}
