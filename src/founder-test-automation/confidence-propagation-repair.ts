/**
 * Confidence Propagation Repair — evidence-based downstream confidence (V1).
 */

import type {
  ConfidenceAdjustmentExplanation,
  ConfidenceAdjustmentReason,
  ExecutionReadinessState,
  ReadinessCategory,
  UpstreamChainConfidenceContext,
} from './founder-test-automation-types.js';
import type { PrioritizedBlocker } from './founder-test-automation-types.js';
import type { FounderTestRealitySweepReport } from '../founder-test-reality-sweep/founder-test-reality-sweep-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type { PlanningGateDecision } from '../planning-gate-authority/planning-gate-types.js';
import {
  capReadinessToGatePermission,
  getMaxAllowedReadiness,
} from '../planning-gate-authority/readiness-permission-matrix.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function hasUpstreamChainContext(upstream?: UpstreamChainConfidenceContext | null): boolean {
  if (!upstream) return false;
  return [
    upstream.unifiedIntakeConfidence,
    upstream.planningGateConfidence,
    upstream.planningBriefConfidence,
    upstream.architectureBriefConfidence,
    upstream.buildPlanConfidence,
  ].some((value) => value != null);
}

export function computeLegacySweepConfidenceAnchor(input: {
  sweepReport: FounderTestRealitySweepReport;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
}): number {
  let confidence = 55;
  confidence += Math.min(15, input.sweepReport.launchStrengths.length * 3);
  if (input.requirementCompletenessAnalysis) confidence += 10;
  return clamp(confidence);
}

const READINESS_SCORE_BY_LABEL: Record<string, number> = {
  READY_FOR_EXECUTION: 92,
  READY_FOR_EXECUTION_PLANNING: 90,
  READY_FOR_EXECUTION_GATE: 92,
  ARCHITECTURE_READY: 86,
  ARCHITECTURE_DRAFT_READY: 82,
  PLANNING_READY: 84,
  DRAFT_BUILD_PLAN: 83,
  READY_FOR_PLANNING: 80,
  READY_WITH_GAPS: 72,
  ALLOW_FULL_PLANNING: 78,
  ALLOW_LIMITED_PLANNING: 74,
  DRAFT_READY: 70,
  NEEDS_CLARIFICATION: 55,
  HIGH_RISK: 45,
  NOT_READY: 35,
};

export function computeUpstreamConfidenceAnchor(
  upstream?: UpstreamChainConfidenceContext | null,
): number {
  if (!upstream) return 55;

  const cascade = [
    upstream.buildPlanConfidence,
    upstream.architectureBriefConfidence,
    upstream.planningBriefConfidence,
    upstream.planningGateConfidence,
    upstream.unifiedIntakeConfidence,
  ].filter((value): value is number => value != null);

  return cascade[0] ?? 55;
}

export function computeUpstreamReadinessAnchor(
  upstream?: UpstreamChainConfidenceContext | null,
): number {
  if (!upstream) return 55;

  const cascade = [
    upstream.buildPlanReadiness,
    upstream.architectureBriefReadiness,
    upstream.planningBriefReadiness,
    upstream.planningGateReadiness,
    upstream.unifiedIntakeReadiness,
  ].filter((value): value is string => Boolean(value));

  for (const label of cascade) {
    const upper = label.toUpperCase();
    if (READINESS_SCORE_BY_LABEL[upper] != null) return READINESS_SCORE_BY_LABEL[upper];
    for (const [key, score] of Object.entries(READINESS_SCORE_BY_LABEL)) {
      if (upper.includes(key)) return score;
    }
  }

  return 55;
}

export function buildUpstreamChainConfidenceFromSimulationContext(context: {
  unifiedIntakeAnalysis?: { unifiedIntakeConfidence: number; intakeReadinessCategory: string } | null;
  planningGateAnalysis?: {
    planningGateDecision: PlanningGateDecision;
    planningGateExplanation: { confidence: number };
    planningReadiness: { planningReadinessCategory: string };
  } | null;
  planningBrief?: { planningBriefConfidence: number; planningBriefReadiness: string } | null;
  architectureBrief?: { architectureBriefConfidence: number; architectureBriefReadiness: string } | null;
  buildPlan?: { buildPlanConfidence: number; buildPlanReadiness: string } | null;
}): UpstreamChainConfidenceContext {
  return {
    readOnly: true,
    unifiedIntakeConfidence: context.unifiedIntakeAnalysis?.unifiedIntakeConfidence ?? null,
    planningGateConfidence: context.planningGateAnalysis?.planningGateExplanation.confidence ?? null,
    planningBriefConfidence: context.planningBrief?.planningBriefConfidence ?? null,
    architectureBriefConfidence: context.architectureBrief?.architectureBriefConfidence ?? null,
    buildPlanConfidence: context.buildPlan?.buildPlanConfidence ?? null,
    unifiedIntakeReadiness: context.unifiedIntakeAnalysis?.intakeReadinessCategory ?? null,
    planningGateReadiness: context.planningGateAnalysis?.planningReadiness.planningReadinessCategory ?? null,
    planningGateDecision: context.planningGateAnalysis?.planningGateDecision ?? null,
    planningBriefReadiness: context.planningBrief?.planningBriefReadiness ?? null,
    architectureBriefReadiness: context.architectureBrief?.architectureBriefReadiness ?? null,
    buildPlanReadiness: context.buildPlan?.buildPlanReadiness ?? null,
  };
}

function scoreToReadinessCategory(score: number): ReadinessCategory {
  if (score >= 90) return 'READY_FOR_EXECUTION';
  if (score >= 70) return 'READY_WITH_ACTIONS';
  if (score >= 40) return 'HIGH_RISK';
  return 'NOT_READY';
}

export function applyGateReadinessCap(input: {
  gateDecision?: PlanningGateDecision | null;
  readinessScore: number;
  executionReadinessState: ExecutionReadinessState;
}): {
  readinessScore: number;
  executionReadinessState: ExecutionReadinessState;
  readinessCategory: ReadinessCategory;
} {
  if (!input.gateDecision) {
    const readinessCategory = scoreToReadinessCategory(input.readinessScore);
    return {
      readinessScore: input.readinessScore,
      executionReadinessState: input.executionReadinessState,
      readinessCategory,
    };
  }

  const cappedState = capReadinessToGatePermission(
    input.gateDecision,
    'FOUNDER_TEST',
    input.executionReadinessState,
  ) as ExecutionReadinessState;

  const maxAllowed = getMaxAllowedReadiness(input.gateDecision, 'FOUNDER_TEST');
  const maxScore = READINESS_SCORE_BY_LABEL[maxAllowed] ?? input.readinessScore;
  const readinessScore = Math.min(input.readinessScore, maxScore);

  if (cappedState === input.executionReadinessState) {
    const readinessCategory = scoreToReadinessCategory(readinessScore);
    return { readinessScore, executionReadinessState: input.executionReadinessState, readinessCategory };
  }

  return {
    readinessScore,
    executionReadinessState: cappedState,
    readinessCategory: cappedState,
  };
}

export function computeJustifiedConfidenceAdjustments(input: {
  upstreamConfidence: number;
  sweepReport: FounderTestRealitySweepReport;
  prioritizedBlockers: readonly PrioritizedBlocker[];
  launchCouncilAssessment?: LaunchCouncilAssessment | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
}): { confidence: number; explanation: ConfidenceAdjustmentExplanation } {
  const criticalBlockers = input.prioritizedBlockers.filter((blocker) => blocker.priority === 'CRITICAL');
  const highBlockers = input.prioritizedBlockers.filter((blocker) => blocker.priority === 'HIGH');
  const reasons: ConfidenceAdjustmentReason[] = [];

  let confidence = input.upstreamConfidence;

  if (criticalBlockers.length > 0) {
    const delta = -Math.min(15, criticalBlockers.length * 5);
    reasons.push({
      readOnly: true,
      reason: `${criticalBlockers.length} critical launch blocker(s) documented in sweep evidence`,
      delta,
      evidence: criticalBlockers.map((blocker) => blocker.blockerId),
    });
    confidence += delta;
  }

  if (highBlockers.length > 0) {
    const delta = -Math.min(10, highBlockers.length * 3);
    reasons.push({
      readOnly: true,
      reason: `${highBlockers.length} high-priority blocker(s) documented in sweep evidence`,
      delta,
      evidence: highBlockers.map((blocker) => blocker.blockerId),
    });
    confidence += delta;
  }

  if (input.sweepReport.founderLaunchVerdict === 'BLOCK_LAUNCH') {
    reasons.push({
      readOnly: true,
      reason: 'Reality sweep returned BLOCK_LAUNCH verdict',
      delta: -12,
      evidence: ['BLOCK_LAUNCH'],
    });
    confidence -= 12;
  }

  if (input.sweepReport.founderLaunchVerdict === 'INSUFFICIENT_EVIDENCE') {
    reasons.push({
      readOnly: true,
      reason: 'Reality sweep reported insufficient evidence',
      delta: -10,
      evidence: ['INSUFFICIENT_EVIDENCE'],
    });
    confidence -= 10;
  }

  if (input.launchCouncilAssessment?.readinessState === 'BLOCKED') {
    reasons.push({
      readOnly: true,
      reason: 'Launch council readiness state is BLOCKED',
      delta: -10,
      evidence: ['LAUNCH_COUNCIL_BLOCKED'],
    });
    confidence -= 10;
  }

  if (input.requirementCompletenessAnalysis?.projectRequirementReadiness === 'NOT_READY') {
    reasons.push({
      readOnly: true,
      reason: 'Requirement completeness marked NOT_READY',
      delta: -8,
      evidence: ['REQUIREMENTS_NOT_READY'],
    });
    confidence -= 8;
  }

  if (reasons.length === 0) {
    reasons.push({
      readOnly: true,
      reason: 'Upstream chain confidence preserved — no contradictory evidence',
      delta: 0,
      evidence: ['CONFIDENCE_PRESERVED'],
    });
  }

  const negativeTotal = reasons.filter((reason) => reason.delta < 0).reduce((sum, reason) => sum + reason.delta, 0);
  const maxJustifiedDrop =
    criticalBlockers.length >= 2 ? 35 : criticalBlockers.length === 1 ? 25 : highBlockers.length >= 2 ? 18 : 15;

  if (Math.abs(negativeTotal) > maxJustifiedDrop) {
    confidence = input.upstreamConfidence - maxJustifiedDrop;
    reasons.push({
      readOnly: true,
      reason: `Confidence reduction capped at ${maxJustifiedDrop} points without additional critical evidence`,
      delta: confidence - (input.upstreamConfidence + negativeTotal),
      evidence: ['MAX_JUSTIFIED_DROP_CAP'],
    });
  }

  confidence = clamp(Math.max(input.upstreamConfidence - maxJustifiedDrop, confidence));

  const delta = confidence - input.upstreamConfidence;

  return {
    confidence,
    explanation: {
      readOnly: true,
      upstreamConfidence: input.upstreamConfidence,
      downstreamConfidence: confidence,
      delta,
      justified: delta >= 0 || reasons.some((reason) => reason.delta < 0),
      adjustmentReasons: reasons,
    },
  };
}

export function computePropagatedReadinessScore(input: {
  upstreamReadinessAnchor: number;
  sweepReport: FounderTestRealitySweepReport;
  prioritizedBlockers: readonly PrioritizedBlocker[];
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
}): number {
  const criticalCount = input.prioritizedBlockers.filter((blocker) => blocker.priority === 'CRITICAL').length;
  const highCount = input.prioritizedBlockers.filter((blocker) => blocker.priority === 'HIGH').length;

  let readinessScore = input.upstreamReadinessAnchor;
  readinessScore -= criticalCount * 4;
  readinessScore -= highCount * 2;

  if (input.sweepReport.founderLaunchVerdict === 'BLOCK_LAUNCH') {
    readinessScore = Math.min(readinessScore, input.upstreamReadinessAnchor - 15);
  }
  if (input.requirementCompletenessAnalysis?.projectRequirementReadiness === 'NOT_READY') {
    readinessScore = Math.min(readinessScore, input.upstreamReadinessAnchor - 10);
  }

  const maxDrop =
    criticalCount >= 2 ? 30 : criticalCount === 1 ? 20 : highCount >= 2 ? 15 : input.prioritizedBlockers.length > 0 ? 12 : 8;
  readinessScore = Math.max(input.upstreamReadinessAnchor - maxDrop, readinessScore);

  return clamp(readinessScore);
}

export function detectUnjustifiedReadinessDrop(input: {
  upstreamReadinessAnchor: number;
  downstreamReadinessScore: number;
  prioritizedBlockers: readonly PrioritizedBlocker[];
  founderLaunchVerdict: string;
}): boolean {
  const criticalCount = input.prioritizedBlockers.filter((blocker) => blocker.priority === 'CRITICAL').length;
  const drop = input.upstreamReadinessAnchor - input.downstreamReadinessScore;

  if (drop <= 20) return false;
  if (criticalCount >= 1 || input.founderLaunchVerdict === 'BLOCK_LAUNCH') return false;
  if (input.upstreamReadinessAnchor >= 80 && input.downstreamReadinessScore <= 45) return true;

  return drop > 30 && criticalCount === 0;
}
