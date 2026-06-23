/**
 * Phase 26.71 — Founder Truth Matrix Integration report builder (V1).
 */

import {
  FOUNDER_TRUTH_MATRIX_INTEGRATION_CORE_QUESTION,
  FOUNDER_TRUTH_MATRIX_INTEGRATION_PHASE,
  FOUNDER_TRUTH_MATRIX_INTEGRATION_REPORT_TITLE,
  FOUNDER_TRUTH_MATRIX_LAUNCH_RECONCILIATION_REPORT_TITLE,
  INTEGRATION_TARGET_AUTHORITIES,
  ORCHESTRATION_FLOW,
  TRUTH_MATRIX_INTEGRATION_SAFETY_GUARANTEES,
} from './founder-truth-matrix-integration-registry.js';
import type { FounderTruthMatrixIntegrationReport } from './founder-truth-matrix-integration-types.js';

export function buildFounderTruthMatrixIntegrationReportMarkdown(
  report: FounderTruthMatrixIntegrationReport,
): string {
  const { reconciliation, founderTruthSummary, categorizedBlockers } = report;
  const lines: string[] = [
    `# ${FOUNDER_TRUTH_MATRIX_INTEGRATION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    FOUNDER_TRUTH_MATRIX_INTEGRATION_CORE_QUESTION,
    '',
    '## Phase',
    '',
    FOUNDER_TRUTH_MATRIX_INTEGRATION_PHASE,
    '',
    '## Safety Guarantees',
    '',
    ...TRUTH_MATRIX_INTEGRATION_SAFETY_GUARANTEES.map((g) => `- ${g}`),
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, i) => `${i + 1}. ${step}`),
    '',
    '## Integration Targets',
    '',
    ...INTEGRATION_TARGET_AUTHORITIES.map((a) => `- ${a}`),
    '',
    '## FOUNDER_TRUTH_MATRIX_RECONCILIATION',
    '',
    `Operation: **${reconciliation.operationId}**`,
    `Pre-reconciliation verdict: **${reconciliation.preReconciliationVerdict}**`,
    `Post-reconciliation verdict: **${reconciliation.postReconciliationVerdict}**`,
    `Override applied: **${reconciliation.verdictOverrideApplied ? 'yes' : 'no'}**`,
    reconciliation.overrideReason ? `Override reason: ${reconciliation.overrideReason}` : '',
    '',
    '| Claim | Truth | Root Cause | Launch Impact |',
    '|-------|-------|------------|---------------|',
  ].filter(Boolean);

  for (const claim of reconciliation.claims) {
    lines.push(
      `| ${claim.claim} | ${claim.truthMatrixVerdict} | ${claim.rootCause} | ${claim.launchImpact} |`,
    );
  }

  lines.push('');
  lines.push('## FOUNDER_TRUTH_SUMMARY');
  lines.push('');
  lines.push('### What Is Actually True');
  lines.push('');
  for (const entry of founderTruthSummary.whatIsActuallyTrue) {
    lines.push(`- ${entry}`);
  }
  lines.push('');
  lines.push('### What Is Actually Broken');
  lines.push('');
  for (const entry of founderTruthSummary.whatIsActuallyBroken) {
    lines.push(`- ${entry}`);
  }
  lines.push('');
  lines.push('### Product Gaps');
  lines.push('');
  for (const entry of founderTruthSummary.productGaps) {
    lines.push(`- ${entry}`);
  }
  lines.push('');
  lines.push('### Testing-System Gaps');
  lines.push('');
  for (const entry of founderTruthSummary.testingSystemGaps) {
    lines.push(`- ${entry}`);
  }
  lines.push('');
  lines.push('### Authority Disagreements');
  lines.push('');
  for (const entry of founderTruthSummary.authorityDisagreements) {
    lines.push(`- ${entry}`);
  }
  lines.push('');
  lines.push('### Launch Blocking Product Gaps');
  lines.push('');
  for (const entry of founderTruthSummary.launchBlockingProductGaps) {
    lines.push(`- ${entry}`);
  }
  lines.push('');
  lines.push('### Non-Blocking Testing Defects');
  lines.push('');
  for (const entry of founderTruthSummary.nonBlockingTestingDefects) {
    lines.push(`- ${entry}`);
  }
  lines.push('');
  lines.push('## Founder Questions (TRUTH_MATRIX_FINAL_ANSWER)');
  lines.push('');
  for (const q of founderTruthSummary.founderQuestions) {
    lines.push(`### ${q.question}`);
    lines.push('');
    lines.push(`**${q.answerToken}: ${q.answer}**`);
    lines.push('');
    lines.push(q.reason);
    lines.push('');
  }
  lines.push('## Categorized Launch Blockers');
  lines.push('');
  lines.push(`Product blockers: ${categorizedBlockers.launchBlockersProduct.length}`);
  lines.push(`Testing blockers: ${categorizedBlockers.launchBlockersTesting.length}`);
  lines.push(
    `Authority disagreement blockers: ${categorizedBlockers.launchBlockersAuthorityDisagreement.length}`,
  );
  lines.push('');
  lines.push('## Reconciliation Counts');
  lines.push('');
  lines.push(`- Scoring defects: ${reconciliation.scoringDefectCount}`);
  lines.push(`- Authority disagreements: ${reconciliation.authorityDisagreementCount}`);
  lines.push(`- Propagation failures: ${reconciliation.propagationFailureCount}`);
  lines.push(`- Real product gaps: ${reconciliation.realProductGapCount}`);
  lines.push(`- Testing system defects: ${reconciliation.testingSystemDefectCount}`);
  lines.push(`- Trust score blocked: ${reconciliation.trustScoreBlocked ? 'yes' : 'no'}`);
  lines.push(`- Product launch blocked: ${reconciliation.productLaunchBlocked ? 'yes' : 'no'}`);
  lines.push('');

  return lines.join('\n');
}

export function buildFounderTruthMatrixLaunchReconciliationReportMarkdown(
  report: FounderTruthMatrixIntegrationReport,
): string {
  const { reconciliation, categorizedBlockers, founderTruthSummary } = report;
  const lines: string[] = [
    `# ${FOUNDER_TRUTH_MATRIX_LAUNCH_RECONCILIATION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Launch Verdict Reconciliation',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| Pre-reconciliation | ${reconciliation.preReconciliationVerdict} |`,
    `| Post-reconciliation | ${reconciliation.postReconciliationVerdict} |`,
    `| Override applied | ${reconciliation.verdictOverrideApplied ? 'yes' : 'no'} |`,
    `| Override reason | ${reconciliation.overrideReason ?? 'none'} |`,
    '',
    '## Override Rules Applied',
    '',
    '- **Rule 1 (SCORING_DEFECT):** Do not block launch — record TESTING_SYSTEM_DEFECT separately.',
    '- **Rule 2 (AUTHORITY_DISAGREEMENT):** Use TRUTH_MATRIX_VERDICT — do not auto-block.',
    '- **Rule 3 (EVIDENCE_PROPAGATION_FAILURE):** Block trust score — do not block product readiness.',
    '- **Rule 4 (REAL_PRODUCT_GAP):** Block launch readiness.',
    '',
    '## launchBlockersProduct',
    '',
  ];

  if (categorizedBlockers.launchBlockersProduct.length === 0) {
    lines.push('- None');
  } else {
    for (const b of categorizedBlockers.launchBlockersProduct) {
      lines.push(`- **[${b.severity}] ${b.sourceAuthority}:** ${b.explanation}`);
    }
  }

  lines.push('');
  lines.push('## launchBlockersTesting');
  lines.push('');

  if (categorizedBlockers.launchBlockersTesting.length === 0) {
    lines.push('- None');
  } else {
    for (const b of categorizedBlockers.launchBlockersTesting) {
      lines.push(`- **[${b.severity}] ${b.sourceAuthority}:** ${b.explanation}`);
    }
  }

  lines.push('');
  lines.push('## launchBlockersAuthorityDisagreement');
  lines.push('');

  if (categorizedBlockers.launchBlockersAuthorityDisagreement.length === 0) {
    lines.push('- None');
  } else {
    for (const b of categorizedBlockers.launchBlockersAuthorityDisagreement) {
      lines.push(`- **[${b.severity}] ${b.sourceAuthority}:** ${b.explanation}`);
    }
  }

  lines.push('');
  lines.push('## Launch Block Category Summary');
  lines.push('');
  lines.push(
    `- Launch blocked by product: **${founderTruthSummary.launchBlockedByProduct ? 'yes' : 'no'}**`,
  );
  lines.push(
    `- Launch blocked by testing infrastructure: **${founderTruthSummary.launchBlockedByTestingInfrastructure ? 'yes' : 'no'}**`,
  );
  lines.push('');

  return lines.join('\n');
}
