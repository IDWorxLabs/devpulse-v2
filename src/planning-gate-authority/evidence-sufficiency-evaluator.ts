/**
 * Evidence Sufficiency Evaluator — coverage dimension scoring (V1).
 */

import type {
  EvidenceCoverageDimension,
  EvidenceSufficiencyResult,
  PlanningGateEvidenceSnapshot,
} from './planning-gate-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function dimension(
  name: EvidenceCoverageDimension['dimension'],
  score: number,
  covered: boolean,
  evidence: string[],
): EvidenceCoverageDimension {
  return { readOnly: true, dimension: name, score: clamp(score), covered, evidence };
}

export function evaluateEvidenceSufficiency(snapshot: PlanningGateEvidenceSnapshot): EvidenceSufficiencyResult {
  const dimensions: EvidenceCoverageDimension[] = [];

  const reqScore =
    snapshot.intakeConfidence * 0.4 +
    (snapshot.completenessScore ?? snapshot.intakeReadinessScore) * 0.6;
  dimensions.push(
    dimension(
      'REQUIREMENTS',
      reqScore,
      snapshot.intakeReadinessScore >= 40,
      [`INTAKE_READINESS_${snapshot.intakeReadinessScore}`, `INTAKE_CONFIDENCE_${snapshot.intakeConfidence}`],
    ),
  );

  dimensions.push(
    dimension(
      'WORKFLOWS',
      snapshot.workflows.length >= 3 ? 90 : snapshot.workflows.length === 2 ? 72 : snapshot.workflows.length === 1 ? 55 : 20,
      snapshot.workflows.length >= 1,
      [`WORKFLOW_COUNT_${snapshot.workflows.length}`],
    ),
  );

  dimensions.push(
    dimension(
      'SCREENS',
      snapshot.screens.length >= 4 ? 92 : snapshot.screens.length >= 2 ? 70 : snapshot.screens.length === 1 ? 48 : 18,
      snapshot.screens.length >= 1,
      [`SCREEN_COUNT_${snapshot.screens.length}`],
    ),
  );

  dimensions.push(
    dimension(
      'ROLES',
      snapshot.userRoles.length >= 2 ? 88 : snapshot.userRoles.length === 1 ? 58 : 15,
      snapshot.userRoles.length >= 1,
      [`ROLE_COUNT_${snapshot.userRoles.length}`],
    ),
  );

  dimensions.push(
    dimension(
      'INTEGRATIONS',
      snapshot.integrations.length >= 2 ? 85 : snapshot.integrations.length === 1 ? 65 : snapshot.platforms.some((p) => /SAAS|COMMERCE/i.test(p)) ? 35 : 20,
      snapshot.integrations.length >= 1,
      [`INTEGRATION_COUNT_${snapshot.integrations.length}`],
    ),
  );

  dimensions.push(
    dimension(
      'BUSINESS_LOGIC',
      snapshot.businessRules.length >= 2 ? 90 : snapshot.businessRules.length === 1 ? 68 : 25,
      snapshot.businessRules.length >= 1,
      [`BUSINESS_RULE_COUNT_${snapshot.businessRules.length}`],
    ),
  );

  const evidenceSufficiencyScore = clamp(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length,
  );

  return {
    readOnly: true,
    evidenceSufficiencyScore,
    dimensions,
    activeSourceCount: snapshot.sources.length,
  };
}
