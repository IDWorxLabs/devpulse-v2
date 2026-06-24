/**
 * General-Purpose Code Generation Gap Investigation — main assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_FAIL_TOKEN,
  GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_PASS_TOKEN,
  CATEGORY_VISION_TARGET,
  RBEP_PROVEN_CATEGORIES,
} from './general-purpose-code-generation-gap-investigation-bounds.js';
import type { GeneralPurposeCodeGenerationGapInvestigationAssessment } from './general-purpose-code-generation-gap-investigation-types.js';
import {
  analyzeRoadmapConsistency,
  buildRemainingCodegenGaps,
  collectEvidenceAnalysis,
  isGeneralPurposeV1Proven,
} from './gap-evidence-analyzer.js';
import { writeGeneralPurposeCodeGenerationGapInvestigationArtifacts } from './gap-investigation-artifact-writer.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

export function runGeneralPurposeCodeGenerationGapInvestigation(input?: {
  projectRootDir?: string;
}): GeneralPurposeCodeGenerationGapInvestigationAssessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const now = new Date();

  const generalPurposeV1Proven = isGeneralPurposeV1Proven(projectRootDir);
  const evidenceAnalysis = collectEvidenceAnalysis(projectRootDir);
  const roadmapConsistency = analyzeRoadmapConsistency(projectRootDir);
  const remainingCodegenGaps = buildRemainingCodegenGaps(projectRootDir);

  const capabilityEntry = evidenceAnalysis.find((e) => e.source === 'Capability Audit V3.1');
  const strategicEntry = evidenceAnalysis.find((e) => e.source === 'Strategic Capability Audit V4');

  const capabilityAuditAgreesWithV1Pass =
    generalPurposeV1Proven && capabilityEntry != null && !capabilityEntry.reportsGap;
  const strategicAuditAgreesWithV1Pass =
    generalPurposeV1Proven && strategicEntry != null && !strategicEntry.reportsGap;

  const roadmapInconsistencyDetected =
    generalPurposeV1Proven &&
    roadmapConsistency.some((f) => !f.consistentWithV1Pass);
  const auditDisagreementDetected =
    generalPurposeV1Proven &&
    capabilityAuditAgreesWithV1Pass &&
    !strategicAuditAgreesWithV1Pass;
  const consistencyRepaired =
    generalPurposeV1Proven &&
    capabilityAuditAgreesWithV1Pass &&
    strategicAuditAgreesWithV1Pass;
  const staleEvidenceDetected = false;
  const realCapabilityGapExists = !generalPurposeV1Proven;
  const v1CoverageInsufficient = false;
  const aspirationalCategoryGapCount = CATEGORY_VISION_TARGET - RBEP_PROVEN_CATEGORIES;
  const unsupportedCategoryCount = aspirationalCategoryGapCount;

  let verdict: GeneralPurposeCodeGenerationGapInvestigationAssessment['verdict'] =
    'ROADMAP_INCONSISTENCY';
  let verdictSummary =
    'General-Purpose Code Generation V1 is proven; the highest-priority gap is a strategic audit roadmap template issue, not a missing V1 capability.';
  let gapProducingAuditSource = 'Strategic Capability Audit V4';
  let shouldV1RemainComplete = generalPurposeV1Proven;
  let shouldV2RoadmapItemExist = generalPurposeV1Proven;
  let roadmapActionRecommendation: GeneralPurposeCodeGenerationGapInvestigationAssessment['roadmapActionRecommendation'] =
    'MARK_V1_COMPLETE';

  if (consistencyRepaired) {
    verdict = 'ROADMAP_INCONSISTENCY';
    verdictSummary =
      'Original inconsistency identified and resolved by Strategic Audit Roadmap Consistency Repair V1 — audits now agree; GP V1 marked COMPLETE.';
    gapProducingAuditSource = 'None — resolved';
    roadmapActionRecommendation = 'MARK_V1_COMPLETE';
  } else if (!generalPurposeV1Proven) {
    verdict = 'REAL_CAPABILITY_GAP';
    verdictSummary = 'General-Purpose Code Generation V1 is not proven — the gap is real.';
    gapProducingAuditSource = 'General-Purpose Code Generation V1';
    shouldV1RemainComplete = false;
    shouldV2RoadmapItemExist = false;
    roadmapActionRecommendation = 'KEEP_EXTEND';
  } else if (auditDisagreementDetected && roadmapInconsistencyDetected) {
    verdict = 'AUDIT_DISAGREEMENT';
    verdictSummary =
      'Capability Audit V3.1 treats GP V1 as mature and closed; Strategic Audit V4 hardcodes GP as rank-1 EXTEND despite V1 PASS — audits disagree.';
  } else if (roadmapInconsistencyDetected) {
    verdict = 'ROADMAP_INCONSISTENCY';
    verdictSummary =
      'Strategic Audit V4 deriveHighestValueNextCapability and roadmap-v4-builder emit GP EXTEND when commercial phases complete, without checking V1 PASS or marking COMPLETE.';
  }

  const investigationProofStatus =
    evidenceAnalysis.length >= 3 &&
    roadmapConsistency.length >= 2 &&
    remainingCodegenGaps.length >= 2 &&
    (consistencyRepaired ||
      (generalPurposeV1Proven ? roadmapInconsistencyDetected || auditDisagreementDetected : realCapabilityGapExists))
      ? 'PROVEN'
      : evidenceAnalysis.length > 0
        ? 'PARTIAL'
        : 'NOT_PROVEN';

  const assessment: GeneralPurposeCodeGenerationGapInvestigationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'General-Purpose Code Generation Gap Investigation',
    passToken:
      investigationProofStatus === 'PROVEN'
        ? GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_PASS_TOKEN
        : GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_FAIL_TOKEN,
    version: 'V1',
    generatedAt: now.toISOString(),
    investigationProofStatus,
    verdict,
    verdictSummary,
    generalPurposeV1Proven,
    realCapabilityGapExists,
    staleEvidenceDetected,
    auditDisagreementDetected,
    v1CoverageInsufficient,
    roadmapInconsistencyDetected,
    gapProducingAuditSource,
    capabilityAuditAgreesWithV1Pass,
    strategicAuditAgreesWithV1Pass,
    shouldV1RemainComplete,
    shouldV2RoadmapItemExist,
    roadmapActionRecommendation,
    unsupportedCategoryCount,
    aspirationalCategoryGapCount,
    evidenceAnalysis,
    roadmapConsistency,
    remainingCodegenGaps,
  };

  writeGeneralPurposeCodeGenerationGapInvestigationArtifacts(projectRootDir, assessment);
  return assessment;
}
