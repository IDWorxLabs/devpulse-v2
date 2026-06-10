/**
 * Missing Capability Escalation — capability gap analysis.
 */

import type {
  BottleneckPatternResult,
  BlockedStatePatternResult,
  CapabilityGapAnalysis,
  CapabilityGapRootCause,
  EscalationInput,
  FailurePatternResult,
  StallPatternResult,
} from './escalation-types.js';
import { getCachedGapAnalysis, setCachedGapAnalysis } from './escalation-cache.js';

export function analyzeCapabilityGap(
  input: EscalationInput,
  failurePattern: FailurePatternResult,
  stallPattern: StallPatternResult,
  bottleneckPattern: BottleneckPatternResult,
  blockedPattern: BlockedStatePatternResult,
): CapabilityGapAnalysis {
  const cacheKey = [
    failurePattern.pattern,
    stallPattern.stallEscalationRequired,
    bottleneckPattern.bottleneckType,
    blockedPattern.loopDetected,
    (input.missingCapabilitySignals ?? []).join(','),
  ].join('|');

  const cached = getCachedGapAnalysis(cacheKey);
  if (cached) return cached;

  const candidateDomains: string[] = [];
  let rootCause: CapabilityGapRootCause = 'RUNTIME_BOTTLENECK';
  let confidence = 30;

  const missingSignals = input.missingCapabilitySignals ?? [];
  if (missingSignals.length > 0) {
    rootCause = 'MISSING_CAPABILITY';
    confidence = 75;
    candidateDomains.push(...missingSignals);
  } else if (failurePattern.detected && failurePattern.pattern === 'repeated_identical_failures') {
    rootCause = 'EXISTING_CAPABILITY_MALFUNCTION';
    confidence = 65;
    candidateDomains.push('autonomous_fixing', 'autonomous_verification');
  } else if (stallPattern.stallEscalationRequired) {
    rootCause = 'MISSING_CAPABILITY';
    confidence = 60;
    candidateDomains.push('progress_intelligence', 'orchestration');
  } else if (bottleneckPattern.detected && bottleneckPattern.bottleneckType === 'resource') {
    rootCause = 'RESOURCE_ISSUE';
    confidence = 70;
    candidateDomains.push('resource_allocation');
  } else if (bottleneckPattern.detected) {
    rootCause = 'RUNTIME_BOTTLENECK';
    confidence = 55 + bottleneckPattern.confidence * 0.3;
    candidateDomains.push(bottleneckPattern.bottleneckType);
  } else if (blockedPattern.loopDetected) {
    rootCause = 'EXISTING_CAPABILITY_MALFUNCTION';
    confidence = 60;
    candidateDomains.push('orchestration', 'verification');
  } else if (failurePattern.detected) {
    rootCause = 'MISSING_CAPABILITY';
    confidence = 50;
    candidateDomains.push('autonomous_testing', 'autonomous_verification');
  }

  if (stallPattern.stallDetected && rootCause !== 'MISSING_CAPABILITY') {
    confidence = Math.max(confidence, 45);
    if (!candidateDomains.includes('progress_tracking')) {
      candidateDomains.push('progress_tracking');
    }
  }

  const analysis: CapabilityGapAnalysis = {
    rootCause,
    confidence: Math.min(100, Math.round(confidence)),
    candidateDomains: [...new Set(candidateDomains)],
  };

  setCachedGapAnalysis(cacheKey, analysis);
  return analysis;
}
