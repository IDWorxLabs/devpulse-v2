/**
 * Missing Capability Escalation — decision engine pipeline.
 */

import type {
  CapabilityEscalationRecord,
  EscalationDecision,
  EscalationInput,
  EscalationReport,
  EscalationTrigger,
} from './escalation-types.js';
import { detectRepeatedFailures } from './failure-pattern-detector.js';
import { detectRepeatedStalls } from './stall-pattern-detector.js';
import { detectRepeatedBottlenecks } from './bottleneck-pattern-detector.js';
import { detectRepeatedBlockedStates } from './blocked-state-detector.js';
import { analyzeCapabilityGap } from './capability-gap-analyzer.js';
import { registerEscalation } from './escalation-registry.js';
import { generateEscalationReport } from './escalation-reporting.js';
import { recordEscalationHistory } from './escalation-history.js';
import { getCachedDecision, setCachedDecision } from './escalation-cache.js';

let escalationCounter = 0;

export interface EscalationDecisionResult {
  record: CapabilityEscalationRecord;
  report: EscalationReport;
}

export function buildEscalationDecision(input: EscalationInput): EscalationDecisionResult {
  const cacheKey = JSON.stringify({
    f: input.failures?.length ?? 0,
    s: input.stalls?.length ?? 0,
    b: input.bottlenecks?.length ?? 0,
    bs: input.blockedStates?.length ?? 0,
    m: input.missingCapabilitySignals?.length ?? 0,
  });

  const failurePattern = detectRepeatedFailures(input.failures ?? []);
  const stallPattern = detectRepeatedStalls(input.stalls ?? []);
  const bottleneckPattern = detectRepeatedBottlenecks(input.bottlenecks ?? []);
  const blockedPattern = detectRepeatedBlockedStates(input.blockedStates ?? []);
  const gapAnalysis = analyzeCapabilityGap(input, failurePattern, stallPattern, bottleneckPattern, blockedPattern);

  let trigger: EscalationTrigger = 'MISSING_CAPABILITY_SUSPECTED';
  let decision: EscalationDecision = 'NO_ESCALATION';
  let confidence = gapAnalysis.confidence;

  if (failurePattern.detected) {
    trigger = 'REPEATED_FAILURE';
  } else if (stallPattern.stallEscalationRequired) {
    trigger = 'REPEATED_STALL';
  } else if (bottleneckPattern.detected) {
    trigger = 'REPEATED_BOTTLENECK';
  } else if (blockedPattern.detected) {
    trigger = 'REPEATED_BLOCKED_STATE';
  }

  const cachedDecision = getCachedDecision(cacheKey);
  if (cachedDecision) {
    decision = cachedDecision;
  } else {
    if (!failurePattern.detected && !stallPattern.stallEscalationRequired
      && !bottleneckPattern.detected && !blockedPattern.detected) {
      decision = 'NO_ESCALATION';
    } else if (gapAnalysis.rootCause === 'MISSING_CAPABILITY' && confidence >= 70) {
      decision = 'CAPABILITY_GAP_DETECTED';
    } else if (gapAnalysis.rootCause === 'MISSING_CAPABILITY' && confidence >= 50) {
      decision = 'RESEARCH_REQUIRED';
    } else if (stallPattern.stallEscalationRequired || failurePattern.severity === 'CRITICAL') {
      decision = 'FOUNDER_REVIEW';
    } else if (failurePattern.detected || stallPattern.stallDetected || bottleneckPattern.detected || blockedPattern.detected) {
      decision = 'INVESTIGATE';
    }
    setCachedDecision(cacheKey, decision);
  }

  escalationCounter += 1;
  const record: CapabilityEscalationRecord = {
    escalationId: `escalation-${escalationCounter}`,
    trigger,
    decision,
    confidence,
    createdAt: Date.now(),
  };

  registerEscalation(record);
  const report = generateEscalationReport(record, {
    failurePattern,
    stallPattern,
    bottleneckPattern,
    blockedPattern,
    gapAnalysis,
  });
  recordEscalationHistory(record);

  return { record, report };
}

export function resetEscalationDecisionCounterForTests(): void {
  escalationCounter = 0;
}
