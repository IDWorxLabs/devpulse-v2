/**
 * Adaptive AutoFix Intelligence — repeated failure pattern detection.
 */

import type { FounderTestV4ReportWithLaunchCouncilFinalization } from '../founder-testing-mode/founder-testing-v4-types.js';
import { REPEATED_FAILURE_THRESHOLD } from './adaptive-autofix-bounds.js';
import type { FailureCategory, FailureRecord } from './adaptive-autofix-types.js';

interface FailureDraft {
  failureCategory: FailureCategory;
  subsystem: string;
  rootCause: string;
  attemptedFixes: string[];
  signals: string[];
}

function countSignals(signals: string[]): number {
  return signals.filter((signal) => signal.trim().length > 0).length;
}

function buildRecord(draft: FailureDraft, timestamp: number): FailureRecord | null {
  const repeatedFailureCount = countSignals(draft.signals);
  if (repeatedFailureCount < REPEATED_FAILURE_THRESHOLD) return null;
  return {
    failureCategory: draft.failureCategory,
    subsystem: draft.subsystem,
    rootCause: draft.rootCause,
    attemptedFixes: draft.attemptedFixes.slice(0, 4),
    repeatedFailureCount,
    lastFailureTimestamp: timestamp,
    outcome: 'FAIL',
  };
}

export function detectRepeatedFailurePatterns(
  report: FounderTestV4ReportWithLaunchCouncilFinalization & {
    launchVerdictGovernance: import('../launch-verdict-governance/launch-verdict-governance-types.js').LaunchVerdictGovernanceAssessment;
  },
): FailureRecord[] {
  const timestamp = report.generatedAt;
  const drafts: FailureDraft[] = [];

  const chatSignals = [
    ...report.chatIntelligenceReality.failedScenarios.map((item) => item.prompt),
    ...report.chatIntelligenceReality.requiredFixesBeforeLaunch,
    ...report.recommendedFixOrder.filter((item) => /chat|answer|response/i.test(item)),
  ];
  if (countSignals(chatSignals) >= REPEATED_FAILURE_THRESHOLD) {
    drafts.push({
      failureCategory: 'CHAT_FAILURE',
      subsystem: 'chat_intelligence_reality',
      rootCause: 'Repeated weak or failing chat responses without durable repair',
      attemptedFixes: report.recommendedFixOrder.filter((item) => /chat|answer|response/i.test(item)),
      signals: chatSignals,
    });
  }

  const typecheckSignals = [
    ...report.repositoryTypecheckReality.findings.map((item) => item.message),
    ...report.issues
      .filter((item) => /typecheck|typescript|tsc/i.test(`${item.problem} ${item.userImpact}`))
      .map((item) => item.problem),
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => /typecheck|repository|compile/i.test(`${gap.title} ${gap.description}`))
      .map((gap) => gap.title),
  ];
  if (countSignals(typecheckSignals) >= REPEATED_FAILURE_THRESHOLD) {
    drafts.push({
      failureCategory: 'TYPECHECK_FAILURE',
      subsystem: 'repository_typecheck_reality',
      rootCause: 'Repeated typecheck or repository integrity failures',
      attemptedFixes: report.recommendedFixOrder.filter((item) => /typecheck|typescript|tsc/i.test(item)),
      signals: typecheckSignals,
    });
  }

  const uiSignals = [
    ...report.uiReviewerAuthority.uiRisks,
    ...report.firstTimeUserRealityAuthority.confusionPoints,
    ...report.userSuccessAuthority.blockers.filter((item) => /ui|screen|navigation|discoverability/i.test(item)),
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => gap.category === 'PRODUCT_GAPS' || gap.impact === 'USER_SUCCESS')
      .map((gap) => gap.title),
  ];
  if (countSignals(uiSignals) >= REPEATED_FAILURE_THRESHOLD) {
    drafts.push({
      failureCategory: 'UI_FAILURE',
      subsystem: 'ui_reviewer_authority',
      rootCause: 'Repeated UI confusion, discoverability, or layout failures',
      attemptedFixes: report.recommendedFixOrder.filter((item) => /ui|screen|navigation|layout/i.test(item)),
      signals: uiSignals,
    });
  }

  const launchSignals = [
    ...report.launchReadinessAuthority.blockers,
    ...report.launchVerdictGovernance.blockingAuthorities,
    ...report.launchCouncilFinalization.launchBlockers,
    ...report.launchVerdictGovernance.failedRules,
  ];
  if (countSignals(launchSignals) >= REPEATED_FAILURE_THRESHOLD) {
    drafts.push({
      failureCategory: 'LAUNCH_FAILURE',
      subsystem: 'launch_readiness_authority',
      rootCause: 'Repeated launch blockers and unresolved launch governance failures',
      attemptedFixes: report.recommendedFixOrder.filter((item) => /launch|readiness|blocker/i.test(item)),
      signals: launchSignals,
    });
  }

  const planningSignals = [
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => /plan|requirement|architecture|planning/i.test(`${gap.title} ${gap.description}`))
      .map((gap) => gap.title),
    ...report.selfEvolutionAuthority.patterns
      .filter((pattern) => pattern.category === 'GAP_DETECTION' || pattern.category === 'REPOSITORY_INTEGRITY')
      .map((pattern) => pattern.failureSignal),
    ...report.recommendedFixOrder.filter((item) => /plan|requirement|architecture/i.test(item)),
  ];
  if (countSignals(planningSignals) >= REPEATED_FAILURE_THRESHOLD) {
    drafts.push({
      failureCategory: 'PLANNING_FAILURE',
      subsystem: 'planning_stack',
      rootCause: 'Repeated planning or requirement extraction failures',
      attemptedFixes: report.recommendedFixOrder.filter((item) => /plan|requirement|architecture/i.test(item)),
      signals: planningSignals,
    });
  }

  const verificationSignals = [
    ...report.realityProofAuthority.findings
      .filter((finding) => finding.evidenceLevel === 'ASSUMED_REALITY' || finding.evidenceLevel === 'UNKNOWN_REALITY')
      .map((finding) => finding.finding),
    ...report.trustAuthority.criticalTrustFailureDetails,
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => gap.category === 'TRUST_GAPS' || gap.category === 'READINESS_GAPS')
      .map((gap) => gap.title),
    ...report.unknownDiscoveryAuthority.findings.map((item) => item.title),
  ];
  if (countSignals(verificationSignals) >= REPEATED_FAILURE_THRESHOLD) {
    drafts.push({
      failureCategory: 'VERIFICATION_FAILURE',
      subsystem: 'reality_proof_authority',
      rootCause: 'Repeated verification, proof, or trust evidence failures',
      attemptedFixes: report.recommendedFixOrder.filter((item) => /verify|proof|trust|evidence/i.test(item)),
      signals: verificationSignals,
    });
  }

  const buildSignals = [
    ...report.ideaToAppResults
      .filter((item) => !item.understandsRequest || item.ideaToAppScore < 60 || item.issues.length > 0)
      .map((item) => item.prompt),
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => /build|execution|implementation/i.test(`${gap.title} ${gap.description}`))
      .map((gap) => gap.title),
    ...report.selfEvolutionAuthority.patterns
      .filter((pattern) => pattern.category === 'PROMISE_FULFILLMENT')
      .map((pattern) => pattern.failureSignal),
  ];
  if (countSignals(buildSignals) >= REPEATED_FAILURE_THRESHOLD) {
    drafts.push({
      failureCategory: 'BUILD_FAILURE',
      subsystem: 'idea_to_app',
      rootCause: 'Repeated build or implementation repair loops without durable fix',
      attemptedFixes: report.recommendedFixOrder.filter((item) => /build|implement|fix/i.test(item)),
      signals: buildSignals,
    });
  }

  const autonomySignals = [
    ...report.selfEvolutionAuthority.patterns
      .filter((pattern) => pattern.category === 'LAUNCH_READINESS' || pattern.category === 'SELF_AWARENESS')
      .map((pattern) => pattern.failureSignal),
    ...report.unknownDiscoveryAuthority.findings
      .filter((item) => /autonom|world 2|builder/i.test(`${item.title} ${item.description}`))
      .map((item) => item.title),
  ];
  if (countSignals(autonomySignals) >= REPEATED_FAILURE_THRESHOLD) {
    drafts.push({
      failureCategory: 'AUTONOMY_FAILURE',
      subsystem: 'self_evolution_authority',
      rootCause: 'Repeated autonomous repair loops without capability evolution',
      attemptedFixes: report.selfEvolutionAuthority.recommendations,
      signals: autonomySignals,
    });
  }

  if (drafts.length === 0 && report.recommendedFixOrder.length >= REPEATED_FAILURE_THRESHOLD) {
    drafts.push({
      failureCategory: 'UNKNOWN_FAILURE',
      subsystem: 'founder_testing',
      rootCause: 'Repeated repair attempts without category-specific resolution',
      attemptedFixes: report.recommendedFixOrder.slice(0, 4),
      signals: report.recommendedFixOrder,
    });
  }

  return drafts
    .map((draft) => buildRecord(draft, timestamp))
    .filter((record): record is FailureRecord => record !== null);
}
