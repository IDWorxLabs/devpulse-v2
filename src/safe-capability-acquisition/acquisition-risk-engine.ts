/**
 * Acquisition risk engine — classifies acquisition risk level.
 * Planning only. No acquisition performed.
 */

import type { AcquisitionInput, AcquisitionMode, AcquisitionRiskLevel } from './types.js';

const SEVERITY_TO_RISK: Record<string, AcquisitionRiskLevel> = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

const MODE_RISK_BOOST: Partial<Record<AcquisitionMode, AcquisitionRiskLevel>> = {
  BUILD_INTERNAL_TOOL: 'MEDIUM',
  REQUEST_EXTERNAL_TOOL: 'HIGH',
  INSTALL_DEPENDENCY_PROPOSAL: 'HIGH',
  CREATE_GOVERNANCE_LAYER: 'HIGH',
  CREATE_VERIFICATION_LAYER: 'MEDIUM',
  CREATE_SIMULATION_LAYER: 'MEDIUM',
  CREATE_DIAGNOSTIC_LAYER: 'MEDIUM',
  CREATE_PREVIEW_LAYER: 'LOW',
  RESEARCH_ONLY: 'LOW',
  DEFER_CAPABILITY: 'LOW',
};

const RISK_ORDER: AcquisitionRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function maxRisk(a: AcquisitionRiskLevel, b: AcquisitionRiskLevel): AcquisitionRiskLevel {
  return RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b;
}

export function classifyAcquisitionRisk(input: AcquisitionInput, blocked: boolean): AcquisitionRiskLevel {
  if (blocked) return 'CRITICAL';

  let risk = SEVERITY_TO_RISK[input.gapSeverity] ?? 'MEDIUM';
  const modeBoost = MODE_RISK_BOOST[input.requestedAcquisitionMode];
  if (modeBoost) risk = maxRisk(risk, modeBoost);

  if (input.capabilityType === 'ARCHITECTURE_CAPABILITY' || input.capabilityType === 'GOVERNANCE_CAPABILITY') {
    risk = maxRisk(risk, 'HIGH');
  }

  if (input.governanceStatus === 'FAIL' || input.governanceStatus === 'UNKNOWN') {
    risk = 'CRITICAL';
  }

  if (input.requestedAcquisitionMode === 'CREATE_GOVERNANCE_LAYER') {
    risk = maxRisk(risk, 'HIGH');
  }

  return risk;
}

export function riskKey(risk: AcquisitionRiskLevel, mode: AcquisitionMode): string {
  return `${risk}|${mode}`;
}

export function requiresRiskApproval(risk: AcquisitionRiskLevel): boolean {
  return risk === 'HIGH' || risk === 'CRITICAL';
}
