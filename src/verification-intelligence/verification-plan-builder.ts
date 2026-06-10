/**
 * Verification Intelligence — plan building pipeline.
 */

import type { VerificationPlan, VerificationPlanInput, VerificationPlanRuntimeReport } from './verification-plan-types.js';
import { analyzeVerificationRisk } from './verification-risk-analyzer.js';
import { analyzeVerificationCost } from './verification-cost-analyzer.js';
import { analyzeVerificationConfidence } from './verification-confidence-analyzer.js';
import { pickVerificationPlanType, selectVerificationPlan } from './verification-plan-selector.js';
import { optimizeVerificationPlan } from './verification-plan-optimizer.js';

const planCache = new Map<string, VerificationPlan>();
const MAX_PLAN_CACHE = 96;
let cacheHits = 0;
let cacheMisses = 0;
let bootstrapReuseCount = 0;

function cacheKey(input: VerificationPlanInput): string {
  return JSON.stringify({
    strategy: input.strategy,
    trustScore: input.trustScore,
    executionMode: input.executionMode,
    criticalSubsystemModified: input.criticalSubsystemModified,
    blastRadius: input.blastRadius,
    requiredValidators: input.requiredValidators,
  });
}

export function markPlanBootstrapReused(): void {
  bootstrapReuseCount += 1;
}

export function buildVerificationPlan(input: VerificationPlanInput): VerificationPlan {
  const key = cacheKey(input);
  const cached = planCache.get(key);
  if (cached) {
    cacheHits += 1;
    markPlanBootstrapReused();
    return { ...cached, id: `vplan-cache-${cached.type.toLowerCase()}`, generatedAt: Date.now() };
  }
  cacheMisses += 1;

  const risk = analyzeVerificationRisk(input);
  const { planType, reasoning: planReasoning } = pickVerificationPlanType(input, risk.riskScore);
  const confidenceAnalysis = analyzeVerificationConfidence(input, planType, risk.riskScore);
  const cost = analyzeVerificationCost(input, planType);

  const optimized = optimizeVerificationPlan(
    input.requiredValidators,
    input.optionalValidators,
    planType,
    risk.riskScore,
  );

  const plan = selectVerificationPlan(
    input,
    risk.riskScore,
    confidenceAnalysis.confidence,
    cost,
    optimized.requiredValidators,
    optimized.optionalValidators,
    optimized.executionOrder,
  );

  plan.reasoning.push(...risk.factors.slice(0, 2));
  plan.reasoning.push(confidenceAnalysis.projection);
  plan.reasoning.push(...planReasoning);

  if (planCache.size >= MAX_PLAN_CACHE) {
    const first = planCache.keys().next().value;
    if (first) planCache.delete(first);
  }
  planCache.set(key, plan);

  return plan;
}

const runtimeReport: VerificationPlanRuntimeReport = {
  cacheHits: 0,
  cacheMisses: 0,
  optimizerReductions: 0,
  estimatedRuntimeMs: 0,
  estimatedValidatorCount: 0,
  bootstrapReuseCount: 0,
  recursionDepth: 0,
};

export function getVerificationPlanRuntimeReport(): VerificationPlanRuntimeReport {
  return {
    ...runtimeReport,
    cacheHits,
    cacheMisses,
    bootstrapReuseCount,
  };
}

export function resetVerificationPlanBuilderForTests(): void {
  planCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  bootstrapReuseCount = 0;
  runtimeReport.cacheHits = 0;
  runtimeReport.cacheMisses = 0;
  runtimeReport.optimizerReductions = 0;
  runtimeReport.estimatedRuntimeMs = 0;
  runtimeReport.estimatedValidatorCount = 0;
  runtimeReport.bootstrapReuseCount = 0;
  runtimeReport.recursionDepth = 0;
}
