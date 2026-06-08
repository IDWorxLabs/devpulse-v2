/**
 * Risk control evaluation engine — evaluates risk controls from builder packet.
 * Verification only. No execution.
 */

import type { RiskControl } from '../world2-autonomous-builder/types.js';
import type { RiskControlResult } from './types.js';

export function evaluateRiskControls(controls: RiskControl[]): RiskControlResult[] {
  return controls.map((control, index) => {
    const failed = control.mitigationRequired && control.likelihood === 'VERY_HIGH';
    const warning = control.mitigationRequired && control.likelihood === 'HIGH';
    return {
      resultId: `world2-risk-result-${(index + 1).toString().padStart(4, '0')}`,
      controlId: control.controlId,
      result: failed ? 'FAILED' : warning ? 'WARNING' : 'PASSED',
      description: `Risk control ${control.likelihood}: ${control.controlDescription}`,
    };
  });
}

export function countCriticalRiskFailures(results: RiskControlResult[]): number {
  return results.filter((r) => r.result === 'FAILED').length;
}

export function riskControlResultsKey(results: RiskControlResult[]): string {
  return results.map((r) => `${r.controlId}|${r.result}`).join(';');
}
