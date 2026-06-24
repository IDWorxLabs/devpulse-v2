/**
 * Self-Evolution Execution V1 — markdown report builder.
 */

import {
  SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN,
  SELF_EVOLUTION_EXECUTION_V1_REPORT_TITLE,
} from './self-evolution-execution-v1-bounds.js';
import type { SelfEvolutionExecutionAssessment } from './self-evolution-execution-v1-types.js';

export function buildSelfEvolutionExecutionV1ReportMarkdown(
  assessment: SelfEvolutionExecutionAssessment,
): string {
  return [
    `# ${SELF_EVOLUTION_EXECUTION_V1_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    'Self-Evolution Execution V1 transforms advisory gap detection into a bounded Observe → Propose → Build → Validate → Measure → Promote pipeline inside World2.',
    '',
    `- Gaps detected: ${assessment.gapsDetected}`,
    `- Proposals generated: ${assessment.proposalsGenerated}`,
    `- Experiments completed: ${assessment.experimentsCompleted}`,
    `- Promotions completed: ${assessment.promotionsCompleted}`,
    `- Evolution proof status: ${assessment.evolutionProofStatus}`,
    `- World1 protected: ${assessment.productionProtection.world1Protected ? 'Yes' : 'No'}`,
    '',
    '## Proof Status',
    '',
    `| Proof | Status |`,
    `| --- | --- |`,
    `| Gap detection | ${assessment.gapDetectionProven ? 'PROVEN' : 'NOT_PROVEN'} |`,
    `| Proposal generation | ${assessment.proposalGenerationProven ? 'PROVEN' : 'NOT_PROVEN'} |`,
    `| World2 experimentation | ${assessment.world2ExperimentationProven ? 'PROVEN' : 'NOT_PROVEN'} |`,
    `| Impact measurement | ${assessment.impactMeasurementProven ? 'PROVEN' : 'NOT_PROVEN'} |`,
    `| Promotion path | ${assessment.promotionPathProven ? 'PROVEN' : 'NOT_PROVEN'} |`,
    `| Production protection | ${assessment.productionProtectionProven ? 'PROVEN' : 'NOT_PROVEN'} |`,
    '',
    '## Detected Gaps',
    '',
    ...assessment.gapAssessment.gaps.slice(0, 10).map(
      (g) => `- **${g.capability}** (${g.gapClass}) — ${g.severity}`,
    ),
    '',
    '## Evolution Proposals',
    '',
    ...assessment.proposals.slice(0, 5).map(
      (p) =>
        `- **${p.targetCapability}** — risk ${p.riskLevel} — ${p.expectedBenefit}`,
    ),
    '',
    '## Experiment Results',
    '',
    ...assessment.experimentResults.map(
      (e) =>
        `- **${e.productName}** — world ${e.worldId} — validation ${e.validationPassed ? 'PASS' : 'FAIL'}`,
    ),
    '',
    '## Impact Measurements',
    '',
    ...assessment.impactAssessments.map(
      (i) =>
        `- Experiment ${i.experimentId.slice(0, 8)} — before ${i.beforeScore} → after ${i.afterScore} (Δ${i.improvement})`,
    ),
    '',
    '## Pass Token',
    '',
    assessment.passToken === SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN
      ? `Pass token: \`${SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN}\``
      : `Status: \`${assessment.passToken}\``,
    '',
  ].join('\n');
}
