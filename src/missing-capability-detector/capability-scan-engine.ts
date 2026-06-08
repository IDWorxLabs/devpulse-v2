/**
 * Capability scan engine — scans for missing capabilities based on analysis source.
 * Detection only. Does not claim capabilities exist when not found.
 */

import type { CapabilityAnalysisInput, CapabilityType, GapSeverity } from './types.js';
import { KNOWN_CAPABILITY_TYPES, SOURCE_CAPABILITY_MAP } from './types.js';

export interface ScannedGap {
  capabilityType: CapabilityType;
  capabilityName: string;
  gapSeverity: GapSeverity;
  gapReason: string;
  gapEvidence: string;
  gapImpact: string;
}

const CAPABILITY_NAMES: Record<CapabilityType, string> = {
  DIAGNOSTIC_CAPABILITY: 'Heavy Diagnostics Layer',
  VERIFICATION_CAPABILITY: 'Completion Verification Layer',
  EXECUTION_CAPABILITY: 'Controlled Execution Support',
  PLANNING_CAPABILITY: 'Execution Planning Layer',
  SIMULATION_CAPABILITY: 'Simulation Runtime Layer',
  PREVIEW_CAPABILITY: 'Mobile Live Preview Layer',
  GOVERNANCE_CAPABILITY: 'Governance Enforcement Layer',
  SECURITY_CAPABILITY: 'Security Validation Layer',
  MOBILE_CAPABILITY: 'Mobile Command Layer',
  PROJECT_INTELLIGENCE_CAPABILITY: 'Project Intelligence Layer',
  LEARNING_CAPABILITY: 'Learning Loop Layer',
  ARCHITECTURE_CAPABILITY: 'Architecture Protection Layer',
  UNKNOWN: 'Unknown Capability',
};

const CONTEXT_GAP_KEYWORDS: Record<string, CapabilityType> = {
  'missing diagnostic': 'DIAGNOSTIC_CAPABILITY',
  'missing verification': 'VERIFICATION_CAPABILITY',
  'missing execution': 'EXECUTION_CAPABILITY',
  'missing planning': 'PLANNING_CAPABILITY',
  'missing simulation': 'SIMULATION_CAPABILITY',
  'missing preview': 'PREVIEW_CAPABILITY',
  'missing governance': 'GOVERNANCE_CAPABILITY',
  'missing security': 'SECURITY_CAPABILITY',
  'missing mobile': 'MOBILE_CAPABILITY',
  'missing intelligence': 'PROJECT_INTELLIGENCE_CAPABILITY',
  'missing learning': 'LEARNING_CAPABILITY',
  'missing architecture': 'ARCHITECTURE_CAPABILITY',
  'approval bottleneck': 'GOVERNANCE_CAPABILITY',
  'simulation failure': 'SIMULATION_CAPABILITY',
  'verification failure': 'VERIFICATION_CAPABILITY',
  'learning outcome': 'LEARNING_CAPABILITY',
  'mobile limitation': 'MOBILE_CAPABILITY',
  'world2 limitation': 'PLANNING_CAPABILITY',
};

function inferSeverity(type: CapabilityType, source: CapabilityAnalysisInput['analysisSource']): GapSeverity {
  if (type === 'GOVERNANCE_CAPABILITY' || type === 'SECURITY_CAPABILITY' || type === 'ARCHITECTURE_CAPABILITY') {
    return 'CRITICAL';
  }
  if (source === 'VERIFICATION_RESULT' || source === 'APPROVAL_RESULT') return 'HIGH';
  if (source === 'EXECUTION_PLAN' || source === 'SIMULATION_RESULT') return 'HIGH';
  if (source === 'MOBILE_REQUEST' || source === 'LEARNING_RESULT') return 'MEDIUM';
  return 'LOW';
}

function scanContextKeywords(input: CapabilityAnalysisInput): ScannedGap[] {
  const gaps: ScannedGap[] = [];
  const text = `${input.analysisContext} ${input.goalSummary} ${input.requestedOutcome}`.toLowerCase();

  for (const [keyword, type] of Object.entries(CONTEXT_GAP_KEYWORDS)) {
    if (text.includes(keyword)) {
      gaps.push({
        capabilityType: type,
        capabilityName: CAPABILITY_NAMES[type],
        gapSeverity: inferSeverity(type, input.analysisSource),
        gapReason: `Context indicates missing ${type.replace(/_/g, ' ').toLowerCase()}`,
        gapEvidence: `Keyword match: "${keyword}" in analysis context`,
        gapImpact: `Goal "${input.goalSummary.slice(0, 80)}" may not be satisfiable without ${CAPABILITY_NAMES[type]}`,
      });
    }
  }

  return gaps;
}

function scanSourceDefaults(input: CapabilityAnalysisInput): ScannedGap[] {
  const types = SOURCE_CAPABILITY_MAP[input.analysisSource] ?? [];
  return types.map((type) => ({
    capabilityType: type,
    capabilityName: CAPABILITY_NAMES[type],
    gapSeverity: inferSeverity(type, input.analysisSource),
    gapReason: `Analysis source ${input.analysisSource} typically requires ${type}`,
    gapEvidence: `Source-to-capability mapping for ${input.analysisSource}`,
    gapImpact: `Requested outcome may be blocked without ${CAPABILITY_NAMES[type]}`,
  }));
}

export function scanForCapabilityGaps(input: CapabilityAnalysisInput): ScannedGap[] {
  const seen = new Set<CapabilityType>();
  const gaps: ScannedGap[] = [];

  for (const gap of [...scanContextKeywords(input), ...scanSourceDefaults(input)]) {
    if (gap.capabilityType === 'UNKNOWN') continue;
    if (!(KNOWN_CAPABILITY_TYPES as readonly string[]).includes(gap.capabilityType)) continue;
    if (seen.has(gap.capabilityType)) continue;
    seen.add(gap.capabilityType);
    gaps.push(gap);
  }

  if (gaps.length === 0 && input.analysisSource !== 'UNKNOWN') {
    gaps.push({
      capabilityType: 'PROJECT_INTELLIGENCE_CAPABILITY',
      capabilityName: CAPABILITY_NAMES.PROJECT_INTELLIGENCE_CAPABILITY,
      gapSeverity: 'LOW',
      gapReason: 'No explicit capability gaps found — latent intelligence gap possible',
      gapEvidence: `Goal analysis for ${input.analysisSource} completed with no explicit gaps`,
      gapImpact: 'Monitor for emerging capability needs as goal evolves',
    });
  }

  return gaps;
}

export function scanKey(gapCount: number, source: string): string {
  return `${source}|${gapCount}`;
}
