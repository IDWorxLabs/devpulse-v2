/**
 * Capability gap classifier — classifies detected gaps by type and severity.
 * Classification only. No acquisition.
 */

import type { CapabilityGapState, CapabilityType, ConfidenceLevel, GapSeverity } from './types.js';
import type { ScannedGap } from './capability-scan-engine.js';

export interface ClassifiedGap extends ScannedGap {
  recommendedCapability: string;
  recommendedAction: string;
  confidenceScore: ConfidenceLevel;
  capabilityGapState: CapabilityGapState;
}

const RECOMMENDED_ACTIONS: Record<CapabilityType, string> = {
  DIAGNOSTIC_CAPABILITY: 'Evaluate diagnostic layer coverage — do not install or execute',
  VERIFICATION_CAPABILITY: 'Evaluate verification layer coverage — do not install or execute',
  EXECUTION_CAPABILITY: 'Evaluate execution support coverage — do not install or execute',
  PLANNING_CAPABILITY: 'Evaluate planning layer coverage — do not install or execute',
  SIMULATION_CAPABILITY: 'Evaluate simulation layer coverage — do not install or execute',
  PREVIEW_CAPABILITY: 'Evaluate preview layer coverage — do not install or execute',
  GOVERNANCE_CAPABILITY: 'Evaluate governance layer coverage — do not install or execute',
  SECURITY_CAPABILITY: 'Evaluate security layer coverage — do not install or execute',
  MOBILE_CAPABILITY: 'Evaluate mobile layer coverage — do not install or execute',
  PROJECT_INTELLIGENCE_CAPABILITY: 'Evaluate project intelligence coverage — do not install or execute',
  LEARNING_CAPABILITY: 'Evaluate learning layer coverage — do not install or execute',
  ARCHITECTURE_CAPABILITY: 'Evaluate architecture protection coverage — do not install or execute',
  UNKNOWN: 'Further analysis required — do not acquire capability',
};

function severityToConfidence(severity: GapSeverity): ConfidenceLevel {
  switch (severity) {
    case 'CRITICAL':
      return 'VERY_HIGH';
    case 'HIGH':
      return 'HIGH';
    case 'MEDIUM':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
}

export function classifyCapabilityGaps(gaps: ScannedGap[]): ClassifiedGap[] {
  return gaps.map((gap) => ({
    ...gap,
    recommendedCapability: gap.capabilityName,
    recommendedAction: RECOMMENDED_ACTIONS[gap.capabilityType],
    confidenceScore: severityToConfidence(gap.gapSeverity),
    capabilityGapState: 'CAPABILITY_GAP_CLASSIFIED' as CapabilityGapState,
  }));
}

export function classificationKey(type: CapabilityType, severity: GapSeverity): string {
  return `${type}|${severity}`;
}

export function countBySeverity(gaps: ClassifiedGap[]): { high: number; critical: number } {
  return {
    high: gaps.filter((g) => g.gapSeverity === 'HIGH').length,
    critical: gaps.filter((g) => g.gapSeverity === 'CRITICAL').length,
  };
}

export function overallConfidence(gaps: ClassifiedGap[]): ConfidenceLevel {
  if (gaps.some((g) => g.confidenceScore === 'VERY_HIGH')) return 'VERY_HIGH';
  if (gaps.some((g) => g.confidenceScore === 'HIGH')) return 'HIGH';
  if (gaps.some((g) => g.confidenceScore === 'MEDIUM')) return 'MEDIUM';
  return 'LOW';
}
