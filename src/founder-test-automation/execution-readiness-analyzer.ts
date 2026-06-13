/**
 * Execution Readiness Analyzer — readiness scoring and guidance (V1).
 */

import {
  applyGateReadinessCap,
  computeJustifiedConfidenceAdjustments,
  computeLegacySweepConfidenceAnchor,
  computePropagatedReadinessScore,
  computeUpstreamConfidenceAnchor,
  computeUpstreamReadinessAnchor,
  detectUnjustifiedReadinessDrop,
  hasUpstreamChainContext,
} from './confidence-propagation-repair.js';
import type {
  ExecutionReadinessAnalysis,
  ExecutionReadinessState,
  PrioritizedBlocker,
  ReadinessCategory,
  RequiredInformationRequest,
} from './founder-test-automation-types.js';
import type { FounderTestRealitySweepReport } from '../founder-test-reality-sweep/founder-test-reality-sweep-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type { UpstreamChainConfidenceContext } from './founder-test-automation-types.js';
import type { VisualReferenceAnalysis } from '../visual-reference-intelligence/visual-reference-types.js';
import type { VoiceNotesAnalysis } from '../voice-notes-intelligence/voice-notes-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function mapReadinessCategory(score: number): ReadinessCategory {
  if (score >= 90) return 'READY_FOR_EXECUTION';
  if (score >= 70) return 'READY_WITH_ACTIONS';
  if (score >= 40) return 'HIGH_RISK';
  return 'NOT_READY';
}

export function mapExecutionReadinessState(category: ReadinessCategory): ExecutionReadinessState {
  return category;
}

export function analyzeExecutionReadiness(input: {
  sweepReport: FounderTestRealitySweepReport;
  prioritizedBlockers: readonly PrioritizedBlocker[];
  launchCouncilAssessment?: LaunchCouncilAssessment | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  upstreamChainConfidence?: UpstreamChainConfidenceContext | null;
}): ExecutionReadinessAnalysis {
  const launchReadiness = input.sweepReport.launchReadinessPercent;
  const completenessScore = input.requirementCompletenessAnalysis?.completenessScore ?? null;
  const chainContextPresent = hasUpstreamChainContext(input.upstreamChainConfidence);

  let upstreamConfidenceAnchor = computeUpstreamConfidenceAnchor(input.upstreamChainConfidence);
  if (!chainContextPresent) {
    upstreamConfidenceAnchor = Math.max(
      upstreamConfidenceAnchor,
      computeLegacySweepConfidenceAnchor({
        sweepReport: input.sweepReport,
        requirementCompletenessAnalysis: input.requirementCompletenessAnalysis ?? null,
      }),
    );
  }

  let upstreamReadinessAnchor = computeUpstreamReadinessAnchor(input.upstreamChainConfidence);
  if (!chainContextPresent) {
    upstreamReadinessAnchor = Math.max(upstreamReadinessAnchor, launchReadiness);
  }

  const { confidence, explanation } = computeJustifiedConfidenceAdjustments({
    upstreamConfidence: upstreamConfidenceAnchor,
    sweepReport: input.sweepReport,
    prioritizedBlockers: input.prioritizedBlockers,
    launchCouncilAssessment: input.launchCouncilAssessment ?? null,
    requirementCompletenessAnalysis: input.requirementCompletenessAnalysis ?? null,
  });

  const propagatedReadinessScore = computePropagatedReadinessScore({
    upstreamReadinessAnchor,
    sweepReport: input.sweepReport,
    prioritizedBlockers: input.prioritizedBlockers,
    requirementCompletenessAnalysis: input.requirementCompletenessAnalysis ?? null,
  });

  const preCapCategory = mapReadinessCategory(propagatedReadinessScore);
  const preCapState = mapExecutionReadinessState(preCapCategory);
  const gateCapped = applyGateReadinessCap({
    gateDecision: input.upstreamChainConfidence?.planningGateDecision ?? null,
    readinessScore: propagatedReadinessScore,
    executionReadinessState: preCapState,
  });

  const readinessScore = gateCapped.readinessScore;
  const readinessCategory = gateCapped.readinessCategory;
  const executionReadinessState = gateCapped.executionReadinessState;
  const criticalCount = input.prioritizedBlockers.filter((blocker) => blocker.priority === 'CRITICAL').length;

  const unjustifiedReadinessDropDetected = detectUnjustifiedReadinessDrop({
    upstreamReadinessAnchor,
    downstreamReadinessScore: readinessScore,
    prioritizedBlockers: input.prioritizedBlockers,
    founderLaunchVerdict: input.sweepReport.founderLaunchVerdict,
  });

  const safeToProceed =
    executionReadinessState === 'READY_FOR_EXECUTION' ||
    (executionReadinessState === 'READY_WITH_ACTIONS' && criticalCount === 0);

  const summary =
    executionReadinessState === 'READY_FOR_EXECUTION'
      ? 'Founder test evidence supports proceeding with guarded execution planning.'
      : executionReadinessState === 'READY_WITH_ACTIONS'
        ? 'Proceed only after completing prioritized improvement path actions.'
        : executionReadinessState === 'HIGH_RISK'
          ? 'Material launch and requirement gaps remain — clarify before planning.'
          : 'Not ready — resolve critical blockers and missing evidence first.';

  return {
    readOnly: true,
    readinessScore,
    readinessCategory,
    executionReadinessState,
    launchReadinessPercent: launchReadiness,
    requirementCompletenessScore: completenessScore,
    confidenceScore: confidence,
    safeToProceed,
    summary,
    confidenceAdjustmentExplanation: explanation,
    unjustifiedReadinessDropDetected,
  };
}

export function detectRequiredInformationRequests(input: {
  sweepReport: FounderTestRealitySweepReport;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  voiceNotesAnalysis?: VoiceNotesAnalysis | null;
  visualReferenceAnalysis?: VisualReferenceAnalysis | null;
}): RequiredInformationRequest[] {
  const requests: RequiredInformationRequest[] = [];
  let counter = 0;

  const push = (
    question: string,
    category: RequiredInformationRequest['category'],
    priority: RequiredInformationRequest['priority'],
    blockingReason: string,
    evidence: string[],
  ) => {
    counter += 1;
    requests.push({
      readOnly: true,
      requestId: `info-request-${counter}`,
      question,
      category,
      priority,
      blockingReason,
      evidence,
    });
  };

  if (input.sweepReport.founderLaunchVerdict === 'INSUFFICIENT_EVIDENCE') {
    push(
      'Which founder test authorities should be rerun to produce sufficient launch evidence?',
      'LAUNCH',
      'CRITICAL',
      'Reality sweep reported insufficient evidence.',
      ['INSUFFICIENT_EVIDENCE'],
    );
  }

  for (const missing of input.sweepReport.inputSnapshot.missingAuthorities.slice(0, 3)) {
    push(
      `Can ${missing} evidence be provided or rerun for this product?`,
      'ARCHITECTURE',
      'HIGH',
      `Missing authority: ${missing}`,
      [missing, 'MISSING_AUTHORITY'],
    );
  }

  const completeness = input.requirementCompletenessAnalysis;
  if (completeness) {
    for (const q of completeness.clarifyingQuestions.filter((q) => q.priority === 'CRITICAL').slice(0, 4)) {
      push(q.question, 'PRODUCT', 'CRITICAL', 'Requirement completeness gap blocks readiness improvement.', [
        ...q.evidence,
      ]);
    }
  }

  const voice = input.voiceNotesAnalysis;
  if (voice) {
    for (const q of voice.clarifyingQuestions.filter((q) => q.priority === 'HIGH').slice(0, 2)) {
      push(q.question, 'PRODUCT', 'HIGH', 'Voice note requirement gap remains unresolved.', [...q.evidence]);
    }
  }

  const visual = input.visualReferenceAnalysis;
  if (visual && visual.completeness.visualCompletenessScore < 60) {
    push(
      'Can you provide visual references for missing screens or navigation paths?',
      'UX',
      'HIGH',
      'Visual reference completeness is below readiness threshold.',
      ['VISUAL_COMPLETENESS_LOW'],
    );
  }

  if (requests.length === 0 && input.sweepReport.launchBlockers.length > 0) {
    push(
      'What is the founder-approved priority order for resolving the top launch blockers?',
      'LAUNCH',
      'MEDIUM',
      'Blockers exist but no explicit founder priority was captured.',
      ['BLOCKER_PRIORITY_UNCONFIRMED'],
    );
  }

  return requests.slice(0, 10);
}
