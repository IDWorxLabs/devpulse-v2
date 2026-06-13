/**
 * Architecture Brief Validator — confidence, quality, and readiness scoring (V1).
 */

import type { PlanningGateDecision } from '../planning-gate-authority/planning-gate-types.js';
import { capReadinessToGatePermission } from '../planning-gate-authority/readiness-permission-matrix.js';
import type {
  ArchitectureBrief,
  ArchitectureBriefQuality,
  ArchitectureBriefReadiness,
} from './architecture-brief-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function mapArchitectureBriefQuality(score: number, sectionCount: number, totalSections: number): ArchitectureBriefQuality {
  const coverageRatio = sectionCount / totalSections;
  if (score >= 85 && coverageRatio >= 1) return 'HIGH_CONFIDENCE';
  if (coverageRatio >= 0.85 && score >= 65) return 'COMPLETE';
  if (coverageRatio >= 0.5 || score >= 40) return 'PARTIAL';
  return 'INSUFFICIENT';
}

export function mapArchitectureBriefReadiness(input: {
  gateDecision: PlanningGateDecision;
  quality: ArchitectureBriefQuality;
  confidence: number;
  riskCount: number;
  criticalRiskCount: number;
}): ArchitectureBriefReadiness {
  if (input.gateDecision === 'REJECT_PLANNING' || input.gateDecision === 'REQUEST_CLARIFICATION') {
    return 'NOT_READY';
  }
  if (
    input.gateDecision === 'ALLOW_FULL_PLANNING' &&
    input.confidence >= 70 &&
    input.criticalRiskCount === 0 &&
    (input.quality === 'COMPLETE' || input.quality === 'HIGH_CONFIDENCE')
  ) {
    return 'ARCHITECTURE_READY';
  }
  if (input.gateDecision === 'ALLOW_LIMITED_PLANNING' || input.riskCount > 0) {
    return 'ARCHITECTURE_DRAFT_READY';
  }
  if (input.gateDecision === 'ALLOW_FULL_PLANNING') return 'ARCHITECTURE_READY';
  return 'ARCHITECTURE_DRAFT_READY';
}

export function validateArchitectureBrief(input: {
  brief: ArchitectureBrief;
  gateDecision: PlanningGateDecision;
  planningBriefConfidence: number;
  gateConfidence: number;
}): {
  architectureBriefConfidence: number;
  architectureBriefQuality: ArchitectureBriefQuality;
  architectureBriefReadiness: ArchitectureBriefReadiness;
} {
  const { brief } = input;

  let sectionCount = 0;
  const totalSections = 6;
  if (brief.systemOverview.objective.length > 0) sectionCount += 1;
  if (brief.frontendSummary.detectedNeeds.length > 0) sectionCount += 1;
  if (brief.backendSummary.detectedNeeds.length > 0) sectionCount += 1;
  if (brief.dataModelSummary.entities.length > 0) sectionCount += 1;
  if (brief.integrationSummary.integrations.length > 0 || brief.integrationSummary.thirdPartyApis.length > 0) sectionCount += 1;
  if (brief.securitySummary.userRoles.length > 0 || brief.securitySummary.authentication.length > 0) sectionCount += 1;

  let confidence = input.planningBriefConfidence * 0.4 + input.gateConfidence * 0.35;
  confidence += (sectionCount / totalSections) * 25;
  confidence -= brief.architectureRiskAnalysis.risks.filter((r) => r.severity === 'CRITICAL').length * 10;
  confidence -= brief.architectureRiskAnalysis.risks.filter((r) => r.severity === 'HIGH').length * 5;

  const architectureBriefConfidence = clamp(confidence);
  const architectureBriefQuality = mapArchitectureBriefQuality(
    architectureBriefConfidence,
    sectionCount,
    totalSections,
  );
  const architectureBriefReadiness = capReadinessToGatePermission(
    input.gateDecision,
    'ARCHITECTURE_BRIEF',
    mapArchitectureBriefReadiness({
      gateDecision: input.gateDecision,
      quality: architectureBriefQuality,
      confidence: architectureBriefConfidence,
      riskCount: brief.architectureRiskAnalysis.riskCount,
      criticalRiskCount: brief.architectureRiskAnalysis.risks.filter((r) => r.severity === 'CRITICAL').length,
    }),
  );

  return { architectureBriefConfidence, architectureBriefQuality, architectureBriefReadiness };
}

export function isArchitectureBriefStructurallyValid(brief: ArchitectureBrief): boolean {
  return (
    brief.briefId.length > 0 &&
    brief.planningBriefId.length > 0 &&
    brief.systemOverview.productType.length > 0 &&
    brief.evidenceSources.length > 0 &&
    brief.architectureBriefConfidence >= 0 &&
    brief.architectureBriefConfidence <= 100
  );
}
