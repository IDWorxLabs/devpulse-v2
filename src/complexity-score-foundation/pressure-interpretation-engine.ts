/**
 * Pressure interpretation engine — interprets complexity pressure from score and factors.
 * Interpretation only. No auto-optimization.
 */

import type { ComplexityAnalysisInput, ComplexityRiskBand, FactorScore, SystemArea } from './types.js';

export function pressureInterpretationKey(score: number, band: ComplexityRiskBand, area: SystemArea): string {
  return `${score}|${band}|${area}`;
}

const AREA_LABELS: Record<SystemArea, string> = {
  FOUNDATION: 'foundation layer',
  GOVERNANCE: 'governance stack',
  WORLD2: 'World 2 stack',
  MOBILE_REMOTE_CONTROL: 'mobile remote control stack',
  SELF_EVOLUTION: 'self-evolution stack',
  EXECUTION: 'execution stack',
  PROJECT_WORKSPACE: 'project workspace',
  CAPABILITY_LAYER: 'capability layer',
  ARCHITECTURE: 'architecture area',
  UNKNOWN: 'system area',
};

export function interpretComplexityPressure(
  input: ComplexityAnalysisInput,
  score: number,
  riskBand: ComplexityRiskBand,
  topFactors: FactorScore[],
): string {
  const areaLabel = AREA_LABELS[input.systemArea];
  const topFactor = topFactors[0]?.factorType.replace(/_/g, ' ').toLowerCase() ?? 'general signals';

  if (riskBand === 'LOW') {
    return `${areaLabel} complexity is manageable (score ${score}/100). Primary factor: ${topFactor}. Continue monitoring — no immediate pressure.`;
  }
  if (riskBand === 'MEDIUM') {
    return `${areaLabel} complexity is rising (score ${score}/100). Primary pressure from ${topFactor}. Review recommended before maintenance burden increases.`;
  }
  if (riskBand === 'HIGH') {
    return `${areaLabel} complexity is elevated (score ${score}/100). Primary pressure from ${topFactor}. Founder review recommended — complexity may become unstable.`;
  }
  return `${areaLabel} complexity is critical (score ${score}/100). Primary pressure from ${topFactor}. Immediate architecture review required — high maintenance and instability risk.`;
}
