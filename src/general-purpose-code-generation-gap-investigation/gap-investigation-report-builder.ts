/**
 * General-Purpose Code Generation Gap Investigation — markdown report builder.
 */

import {
  GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_PASS_TOKEN,
  GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_REPORT_TITLE,
  CATEGORY_VISION_TARGET,
  RBEP_PROVEN_CATEGORIES,
  GP_V1_PROOF_DOMAINS,
} from './general-purpose-code-generation-gap-investigation-bounds.js';
import type { GeneralPurposeCodeGenerationGapInvestigationAssessment } from './general-purpose-code-generation-gap-investigation-types.js';

export function buildGeneralPurposeCodeGenerationGapInvestigationReportMarkdown(
  assessment: GeneralPurposeCodeGenerationGapInvestigationAssessment,
): string {
  const evidenceRows = assessment.evidenceAnalysis
    .map(
      (e) =>
        `| ${e.source} | ${e.generalPurposeV1Proven ? 'YES' : 'NO'} | ${e.reportsGap ? 'YES' : 'NO'} | ${e.codeGenerationScore ?? '—'} | ${e.highestPriority.slice(0, 60)} |`,
    )
    .join('\n');

  return [
    `# ${GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Verdict',
    '',
    `**Verdict:** ${assessment.verdict}`,
    '',
    assessment.verdictSummary,
    '',
    `- General-Purpose Code Generation V1 proven: **${assessment.generalPurposeV1Proven ? 'YES' : 'NO'}**`,
    `- Real capability gap: **${assessment.realCapabilityGapExists ? 'YES' : 'NO'}**`,
    `- Stale evidence: **${assessment.staleEvidenceDetected ? 'YES' : 'NO'}**`,
    `- Audit disagreement: **${assessment.auditDisagreementDetected ? 'YES' : 'NO'}**`,
    `- Roadmap inconsistency: **${assessment.roadmapInconsistencyDetected ? 'YES' : 'NO'}**`,
    `- Gap-producing audit source: **${assessment.gapProducingAuditSource}**`,
    '',
    '## Investigation Questions',
    '',
    '| Question | Answer |',
    '| --- | --- |',
    `| What specific capability is missing? | ${assessment.realCapabilityGapExists ? 'GP V1 itself' : 'None at V1 scope — aspirational 58-category headroom only'} |`,
    `| What application classes remain unsupported? | ${assessment.unsupportedCategoryCount} categories outside RBEP ${RBEP_PROVEN_CATEGORIES}/${CATEGORY_VISION_TARGET} full-pipeline proof |`,
    `| Which audit source is producing the gap? | ${assessment.gapProducingAuditSource} |`,
    `| Is this a roadmap consistency issue? | ${assessment.roadmapInconsistencyDetected ? 'YES' : 'NO'} |`,
    `| Should GP V1 remain COMPLETE? | ${assessment.shouldV1RemainComplete ? 'YES — mark COMPLETE in strategic roadmap' : 'NO — prove V1 first'} |`,
    `| Should a GP V2 roadmap item exist? | ${assessment.shouldV2RoadmapItemExist ? 'OPTIONAL — only for 58-category scale-up, not to fix V1' : 'Not yet'} |`,
    '',
    '## Evidence Analysis',
    '',
    '| Source | V1 Proven | Reports Gap | Score | Highest Priority |',
    '| --- | --- | --- | --- | --- |',
    evidenceRows,
    '',
    '## Root Cause',
    '',
    assessment.generalPurposeV1Proven
      ? [
          '1. **GENERAL_PURPOSE_CODE_GENERATION_V1_PASS is valid** — 10/10 proof domains, maturity 100/100.',
          '2. **Capability Audit V3.1 agrees** — removes GP from missing capabilities; code generation status MATURE.',
          '3. **Strategic Audit V4 disagrees** — when Continuous Deployment + Observability + Customer Operations are proven, `deriveHighestValueNextCapability()` hardcodes General-Purpose Code Generation as the next priority without checking V1 PASS.',
          '4. **Roadmap builder emits EXTEND, not COMPLETE** — `roadmap-v4-builder.ts` rank 1 is GP EXTEND even though V1 PASS exists.',
          '5. **Code Generation Diversity dimension capped at 75/100** — reflects 58-category vision headroom, not V1 failure.',
          '',
          '**Conclusion:** The reappearance of GP as highest priority is a **roadmap consistency issue**, not evidence that V1 failed.',
        ].join('\n')
      : 'GP V1 is not proven — investigate and run validate:general-purpose-code-generation-v1.',
    '',
    '## Remaining Codegen Gaps',
    '',
    ...assessment.remainingCodegenGaps.map(
      (g) => `- **[${g.category}] ${g.capability}** (${g.severity}): ${g.detail}`,
    ),
    '',
    '## Recommendations',
    '',
    `- **Roadmap action:** ${assessment.roadmapActionRecommendation}`,
    '- Mark **General-Purpose Code Generation V1** as **COMPLETE** in Strategic Audit V4 when PASS token present.',
    '- Reserve **General-Purpose Code Generation V2** for optional 58-category scale-up — not required to resolve current inconsistency.',
    '- Raise Code Generation Diversity dimension to 90+ when V1 PASS to align with capability audit maturity.',
    '',
    '## Pass Token',
    '',
    assessment.passToken === GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_PASS_TOKEN
      ? `\`${GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_PASS_TOKEN}\``
      : assessment.passToken,
    '',
  ].join('\n');
}
