/**
 * AIDEVENGINE_BUILD_PROOF_V1_4 — architecture evidence consumption mapping.
 */

import type { ProductArchitectureAssessment } from '../product-architect-intelligence-v1/product-architect-intelligence-types.js';
import type { UvlMaturityAssessment } from '../unified-verification-lab/uvl-maturity-types.js';
import type { ArchitectureConsumptionEntry, ArchitectureConsumptionMap } from './product-architecture-evidence-types.js';
import type { ProductArchitectureEvidence } from './product-architecture-evidence-types.js';

export function buildArchitectureConsumptionMap(input: {
  productArchitectureEvidence: ProductArchitectureEvidence;
  productArchitectureBefore: ProductArchitectureAssessment;
  productArchitectureAfter: ProductArchitectureAssessment;
  uvlBefore: UvlMaturityAssessment | null;
  uvlAfter: UvlMaturityAssessment;
  aflaBefore: { verdict: string; score: number } | null;
  aflaAfter: { verdict: string; score: number };
  founderBefore: { allPrerequisitesPassed: boolean; missingPrerequisites: readonly string[] } | null;
  founderAfter: { allPrerequisitesPassed: boolean; missingPrerequisites: readonly string[] };
}): ArchitectureConsumptionMap {
  const paBefore = input.productArchitectureBefore;
  const paAfter = input.productArchitectureAfter;

  const entries: ArchitectureConsumptionEntry[] = [
    {
      readOnly: true,
      authority: 'Product Architecture',
      consumed: paAfter.gapReport.criticalGapCount < paBefore.gapReport.criticalGapCount || paAfter.scores.productReadinessScore > paBefore.scores.productReadinessScore,
      evidenceFieldsConsumed: input.productArchitectureEvidence.items
        .filter((i) => i.passed)
        .map((i) => i.id),
      scoreBefore: paBefore.scores.productReadinessScore,
      scoreAfter: paAfter.scores.productReadinessScore,
      verdictBefore: paBefore.scores.readinessLabel,
      verdictAfter: paAfter.scores.readinessLabel,
      missingFields: paAfter.gapReport.criticalGapCount > 0
        ? paAfter.gapReport.gapSummary
        : [],
      detail: `criticalGaps ${paBefore.gapReport.criticalGapCount} → ${paAfter.gapReport.criticalGapCount}; workspace evidence ${input.productArchitectureEvidence.passedCount}/${input.productArchitectureEvidence.totalCount}`,
    },
    {
      readOnly: true,
      authority: 'Verification Hub (UVL)',
      consumed: Boolean(input.uvlAfter),
      evidenceFieldsConsumed: [
        'product-architecture-evidence',
        'visual-runtime-evidence',
        'uvl-behaviour-evidence',
        'registered assessments',
      ],
      scoreBefore: input.uvlBefore?.verificationConfidenceScore ?? null,
      scoreAfter: input.uvlAfter.verificationConfidenceScore,
      verdictBefore: input.uvlBefore?.verificationSufficientForLaunch ? 'SUFFICIENT' : 'INSUFFICIENT',
      verdictAfter: input.uvlAfter.verificationSufficientForLaunch ? 'SUFFICIENT' : 'INSUFFICIENT',
      missingFields: input.uvlAfter.verificationSufficientForLaunch
        ? []
        : [
            ...(input.uvlAfter.verificationGapReport.criticalGapCount > 0
              ? [`${input.uvlAfter.verificationGapReport.criticalGapCount} critical gap(s)`]
              : []),
            ...input.uvlAfter.verificationGapReport.gapSummary.slice(0, 3),
          ],
      detail: `coverage ${input.uvlBefore?.overallCoveragePercent ?? 'n/a'}% → ${input.uvlAfter.overallCoveragePercent}%`,
    },
    {
      readOnly: true,
      authority: 'Autonomous Founder Launch Authority (AFLA)',
      consumed: true,
      evidenceFieldsConsumed: [
        'registerSourceDerivedProductArchitectureAssessment',
        'workspace architecture evidence',
        'registered visual/feature/engineering assessments',
      ],
      scoreBefore: input.aflaBefore?.score ?? null,
      scoreAfter: input.aflaAfter.score,
      verdictBefore: input.aflaBefore?.verdict ?? null,
      verdictAfter: input.aflaAfter.verdict,
      missingFields:
        input.aflaAfter.verdict === 'LAUNCH_READY' || input.aflaAfter.verdict === 'LAUNCH_READY_WITH_WARNINGS'
          ? []
          : [`AFLA verdict ${input.aflaAfter.verdict}`],
      detail: `AFLA ${input.aflaBefore?.verdict ?? 'n/a'} (${input.aflaBefore?.score ?? 'n/a'}) → ${input.aflaAfter.verdict} (${input.aflaAfter.score})`,
    },
    {
      readOnly: true,
      authority: 'Founder Launch Readiness',
      consumed: true,
      evidenceFieldsConsumed: [
        'productArchitectureEvidence',
        'useRegisteredProductArchitecture',
        'useRegisteredVerificationHub',
      ],
      scoreBefore: null,
      scoreAfter: null,
      verdictBefore: input.founderBefore?.allPrerequisitesPassed ? 'PREREQUISITES_MET' : 'PREREQUISITES_INCOMPLETE',
      verdictAfter: input.founderAfter.allPrerequisitesPassed ? 'PREREQUISITES_MET' : 'PREREQUISITES_INCOMPLETE',
      missingFields: input.founderAfter.missingPrerequisites,
      detail: `missing prerequisites ${input.founderBefore?.missingPrerequisites.length ?? 'n/a'} → ${input.founderAfter.missingPrerequisites.length}`,
    },
  ];

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    entries,
  };
}
