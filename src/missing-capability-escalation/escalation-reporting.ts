/**
 * Missing Capability Escalation — reporting.
 */

import type {
  BottleneckPatternResult,
  BlockedStatePatternResult,
  CapabilityEscalationRecord,
  CapabilityGapAnalysis,
  EscalationReport,
  FailurePatternResult,
  StallPatternResult,
} from './escalation-types.js';

let reportCounter = 0;

const DECISION_ACTIONS: Record<string, string> = {
  NO_ESCALATION: 'Continue monitoring — no escalation required',
  INVESTIGATE: 'Investigate patterns before capability changes',
  CAPABILITY_GAP_DETECTED: 'Capability gap detected — prepare acquisition planning',
  RESEARCH_REQUIRED: 'Research required to confirm missing capability',
  FOUNDER_REVIEW: 'Escalate to founder review for stall or critical failure',
};

export function generateEscalationReport(
  record: CapabilityEscalationRecord,
  context: {
    failurePattern: FailurePatternResult;
    stallPattern: StallPatternResult;
    bottleneckPattern: BottleneckPatternResult;
    blockedPattern: BlockedStatePatternResult;
    gapAnalysis: CapabilityGapAnalysis;
  },
): EscalationReport {
  reportCounter += 1;

  const rootCauseCandidates = [context.gapAnalysis.rootCause];
  if (context.bottleneckPattern.detected && context.gapAnalysis.rootCause !== 'RUNTIME_BOTTLENECK') {
    rootCauseCandidates.push('RUNTIME_BOTTLENECK');
  }
  if (context.bottleneckPattern.bottleneckType === 'resource') {
    rootCauseCandidates.push('RESOURCE_ISSUE');
  }

  return {
    reportId: `escalation-report-${reportCounter}`,
    escalationId: record.escalationId,
    trigger: record.trigger,
    decision: record.decision,
    confidence: record.confidence,
    rootCauseCandidates: [...new Set(rootCauseCandidates)],
    recommendedAction: DECISION_ACTIONS[record.decision] ?? 'Review escalation context',
    failurePattern: context.failurePattern,
    stallPattern: context.stallPattern,
    bottleneckPattern: context.bottleneckPattern,
    blockedPattern: context.blockedPattern,
    gapAnalysis: context.gapAnalysis,
    generatedAt: Date.now(),
  };
}

export function resetEscalationReportCounterForTests(): void {
  reportCounter = 0;
}
