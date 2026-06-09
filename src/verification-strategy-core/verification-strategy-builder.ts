/**
 * Verification Strategy Core — decision pipeline builder.
 */

import type {
  VerificationStrategyDecision,
  VerificationStrategyInput,
  VerificationStrategyRuntimeReport,
} from './verification-strategy-types.js';
import { evaluateVerificationRequirements } from './verification-requirement-evaluator.js';
import { calculateVerificationConfidence } from './verification-confidence-policy.js';
import { shouldEscalateVerification } from './verification-escalation-policy.js';
import { pickVerificationStrategy } from './verification-strategy-selector.js';
import {
  getExpectedValidatorsForStrategy,
  getMinimumConfidenceForStrategy,
} from './verification-strategy-registry.js';

let bootstrapReuseCount = 0;
let routingCacheHits = 0;
let routingCacheMisses = 0;

const decisionCache = new Map<string, VerificationStrategyDecision>();
const MAX_DECISION_CACHE = 128;

function cacheKey(input: VerificationStrategyInput): string {
  return JSON.stringify({
    taskType: input.taskType,
    riskLevel: input.riskLevel,
    trustScore: input.trustScore,
    changeScope: input.changeScope,
    executionMode: input.executionMode,
    releaseReady: input.releaseReady,
    brainChanged: input.brainChanged,
    routingChanged: input.routingChanged,
    cloudRuntimeTouched: input.cloudRuntimeTouched,
    world2ExecutionActive: input.world2ExecutionActive,
  });
}

export function buildVerificationStrategy(
  input: VerificationStrategyInput,
): VerificationStrategyDecision {
  const key = cacheKey(input);
  const cached = decisionCache.get(key);
  if (cached) {
    routingCacheHits += 1;
    return { ...cached, generatedAt: Date.now() };
  }
  routingCacheMisses += 1;

  const started = Date.now();

  const requirements = evaluateVerificationRequirements(input);
  const confidence = calculateVerificationConfidence(input);
  const { strategy, reason } = pickVerificationStrategy(input);
  const escalationRequired = shouldEscalateVerification(input, confidence, strategy);

  const registryValidators = getExpectedValidatorsForStrategy(strategy);
  const requiredValidators = [
    ...new Set([...requirements.requiredValidators, ...registryValidators]),
  ];
  const optionalValidators = requirements.optionalValidators.filter(
    (v) => !requiredValidators.includes(v),
  );

  if (escalationRequired && strategy !== 'TRUST_RECOVERY') {
    reason.push('Escalation required — verification must intensify before trusting result');
  }

  const minConfidence = getMinimumConfidenceForStrategy(strategy);
  if (confidence < minConfidence) {
    reason.push(`Confidence ${confidence} below minimum ${minConfidence} for ${strategy}`);
  }

  reason.push(...requirements.reasons.slice(0, 3));

  const decision: VerificationStrategyDecision = {
    strategy,
    confidence,
    escalationRequired,
    reason,
    requiredValidators,
    optionalValidators,
    generatedAt: Date.now(),
  };

  if (decisionCache.size >= MAX_DECISION_CACHE) {
    const firstKey = decisionCache.keys().next().value;
    if (firstKey) decisionCache.delete(firstKey);
  }
  decisionCache.set(key, decision);

  const elapsed = Date.now() - started;
  if (elapsed > 50) {
    runtimeReport.slowValidationGroups.push(`buildVerificationStrategy:${elapsed}ms`);
  }

  return decision;
}

const runtimeReport: VerificationStrategyRuntimeReport = {
  routingCacheHits: 0,
  routingCacheMisses: 0,
  bootstrapReuseCount: 0,
  validatorExecutionTimeMs: 0,
  slowValidationGroups: [],
  timeoutEvents: 0,
  skippedValidatorReasons: ['No validator execution in strategy-only phase'],
  recursionDepth: 0,
  duplicatePreventionHits: 0,
};

export function markBootstrapReused(): void {
  bootstrapReuseCount += 1;
  runtimeReport.bootstrapReuseCount = bootstrapReuseCount;
}

export function getVerificationStrategyRuntimeReport(): VerificationStrategyRuntimeReport {
  return {
    ...runtimeReport,
    routingCacheHits,
    routingCacheMisses,
    bootstrapReuseCount,
  };
}

export function resetVerificationStrategyBuilderForTests(): void {
  decisionCache.clear();
  bootstrapReuseCount = 0;
  routingCacheHits = 0;
  routingCacheMisses = 0;
  runtimeReport.routingCacheHits = 0;
  runtimeReport.routingCacheMisses = 0;
  runtimeReport.bootstrapReuseCount = 0;
  runtimeReport.validatorExecutionTimeMs = 0;
  runtimeReport.slowValidationGroups = [];
  runtimeReport.timeoutEvents = 0;
  runtimeReport.skippedValidatorReasons = ['No validator execution in strategy-only phase'];
  runtimeReport.recursionDepth = 0;
  runtimeReport.duplicatePreventionHits = 0;
}
