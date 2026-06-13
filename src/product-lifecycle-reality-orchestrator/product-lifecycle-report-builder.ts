/**
 * Product Lifecycle Reality Orchestrator — markdown report builder.
 */

import {
  PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PASS_TOKEN,
  PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PHASE,
  PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_REPORT_TITLE,
  PRODUCT_LIFECYCLE_REALITY_CORE_QUESTION,
  SAFETY_GUARANTEES,
} from './product-lifecycle-reality-registry.js';
import type { ProductLifecycleRealityReport } from './product-lifecycle-reality-types.js';

export function buildProductLifecycleRealityReportMarkdown(
  report: ProductLifecycleRealityReport,
): string {
  const lines: string[] = [
    `# ${PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Phase',
    '',
    PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PHASE,
    '',
    '## Core Question',
    '',
    PRODUCT_LIFECYCLE_REALITY_CORE_QUESTION,
    '',
    '# Product Lifecycle Reality Orchestrator',
    '',
    '## Lifecycle State',
    '',
    `**${report.productLifecycleRealityState}**`,
    '',
    '## Overall Lifecycle Score',
    '',
    `${report.overallLifecycleScore}/100`,
    '',
    '## Lifecycle Confidence',
    '',
    `${report.lifecycleConfidenceScore}/100`,
    '',
    '## Highest Proven Stage',
    '',
    `**${report.highestProvenStage}** — ${report.stageClassification.classificationReason}`,
    '',
    '## Next Required Action',
    '',
    `**${report.nextRequiredAction}** — ${report.nextAction.actionReason}`,
    '',
    `- evidence-backed: ${report.nextAction.evidenceBacked ? 'YES' : 'NO'}`,
    `- can scale now: ${report.canScaleNow ? 'YES' : 'NO'}`,
    '',
    '## Execution Summary',
    '',
    `- execution score: ${report.executionScore}/100`,
    `- execution state: ${report.inputSnapshot.liveExecutionRunner?.executionState ?? 'UNKNOWN'}`,
    `- execution verdict: ${report.inputSnapshot.liveExecutionRunner?.executionVerdict ?? 'UNKNOWN'}`,
    '',
    '## Launch Summary',
    '',
    `- launch score: ${report.launchScore}/100`,
    `- founder decision: ${report.inputSnapshot.founderLaunchDecision?.founderLaunchDecision ?? 'UNKNOWN'}`,
    `- can launch now: ${report.inputSnapshot.founderLaunchDecision?.canLaunchNow ? 'YES' : 'NO'}`,
    '',
    '## Post-Launch Summary',
    '',
    `- post-launch score: ${report.postLaunchScore}/100`,
    `- post-launch state: ${report.inputSnapshot.postLaunchReality?.postLaunchRealityState ?? 'UNKNOWN'}`,
    `- activity observed: ${report.inputSnapshot.postLaunchReality?.activityObserved ? 'YES' : 'NO'}`,
    '',
    '## Adoption Summary',
    '',
    `- adoption score: ${report.adoptionScore}/100`,
    `- adoption state: ${report.inputSnapshot.adoptionReality?.adoptionRealityState ?? 'UNKNOWN'}`,
    `- repeat usage observed: ${report.inputSnapshot.adoptionReality?.repeatUsageObserved ? 'YES' : 'NO'}`,
    '',
    '## Revenue Summary',
    '',
    `- revenue score: ${report.revenueScore}/100`,
    `- revenue state: ${report.inputSnapshot.revenueReality?.revenueRealityState ?? 'UNKNOWN'}`,
    `- revenue observed: ${report.inputSnapshot.revenueReality?.revenueObserved ? 'YES' : 'NO'}`,
    '',
    '## Evolution Summary',
    '',
    `- evolution score: ${report.evolutionScore}/100`,
    `- evolution state: ${report.inputSnapshot.productEvolutionReality?.productEvolutionState ?? 'UNKNOWN'}`,
    `- learning observed: ${
      report.inputSnapshot.productEvolutionReality?.feedbackLearningObserved ||
      report.inputSnapshot.productEvolutionReality?.usageLearningObserved
        ? 'YES'
        : 'NO'
    }`,
    '',
    '## Lifecycle Gaps',
    '',
    ...report.gapAnalysis.missingEvidence.map((g) => `- missing: ${g}`),
    ...report.gapAnalysis.weakEvidence.map((g) => `- weak: ${g}`),
    ...report.gapAnalysis.brokenProofLinks.map((g) => `- broken link: ${g}`),
    ...(report.gapAnalysis.missingEvidence.length === 0 &&
    report.gapAnalysis.weakEvidence.length === 0 &&
    report.gapAnalysis.brokenProofLinks.length === 0
      ? ['- none identified']
      : []),
    '',
    '## Lifecycle Risks',
    '',
    `- lifecycle risk score: ${report.riskAnalysis.lifecycleRiskScore}/100`,
    ...report.riskAnalysis.riskSignals.map((r) => `- ${r}`),
    ...(report.riskAnalysis.riskSignals.length === 0 ? ['- no significant lifecycle risks identified'] : []),
    '',
    '## Recommended Actions',
    '',
    ...report.recommendedActions.map((a) => `- ${a}`),
    '',
    '## Final Lifecycle Verdict',
    '',
    report.finalVerdict,
    '',
    '## Safety Guarantees',
    '',
    ...SAFETY_GUARANTEES.map((g) => `- ${g}`),
    '',
    '## Pass Token',
    '',
    PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PASS_TOKEN,
  ];

  return lines.join('\n');
}

export function formatProductLifecycleRealitySummary(report: ProductLifecycleRealityReport): string {
  return (
    `${report.productLifecycleRealityState} (${report.overallLifecycleScore}/100) → ${report.nextRequiredAction}`
  );
}
