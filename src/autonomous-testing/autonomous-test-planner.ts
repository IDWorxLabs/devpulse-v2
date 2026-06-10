/**
 * Autonomous Testing — plan builder and readiness evaluation.
 */

import type {
  AutonomousTestPlan,
  AutonomousTestPlanInput,
  AutonomousTestReadiness,
} from './autonomous-testing-types.js';
import { analyzeAutonomousTestRisk } from './autonomous-test-risk-analyzer.js';
import { analyzeAutonomousTestConfidence } from './autonomous-test-confidence-analyzer.js';
import { analyzeAutonomousTestCost } from './autonomous-test-cost-analyzer.js';
import { buildAutonomousTestCoverageModel } from './autonomous-test-coverage-model.js';
import { selectAutonomousTestDepth, selectAutonomousTestCategories } from './autonomous-test-selector.js';
import { buildAutonomousTestSuites } from './autonomous-test-suite-builder.js';
import { getAutonomousTestDepthEntry } from './autonomous-test-registry.js';

const planCache = new Map<string, AutonomousTestPlan>();
const MAX_PLAN_CACHE = 96;
let cacheHits = 0;
let cacheMisses = 0;

function cacheKey(input: AutonomousTestPlanInput): string {
  return JSON.stringify({
    verificationStrategy: input.verificationStrategy,
    verificationPlanType: input.verificationPlanType,
    trustScore: input.trustScore,
    changeScope: input.changeScope,
    executionMode: input.executionMode,
    brainChanged: input.brainChanged,
    routingChanged: input.routingChanged,
  });
}

export function evaluateAutonomousTestReadiness(
  input: AutonomousTestPlanInput,
  plan: Omit<AutonomousTestPlan, 'readiness' | 'id' | 'generatedAt'>,
): AutonomousTestReadiness {
  if (plan.requiredSuites.length === 0) return 'BLOCKED';
  if (!input.changeScope && !input.executionMode) return 'NEEDS_MORE_CONTEXT';
  if (input.trustScore < 40 || input.repeatFailuresDetected || input.verificationReadiness === 'TRUST_RECOVERY_REQUIRED') {
    return 'TRUST_RECOVERY_REQUIRED';
  }
  if (plan.riskScore >= 80 || input.blastRadius === 'PLATFORM' || input.verificationReadiness === 'RISK_ESCALATED') {
    return 'RISK_ESCALATED';
  }
  if (plan.confidence < 45) return 'BLOCKED';
  if (!input.subsystemTouched?.length && !input.changeScope) return 'NEEDS_MORE_CONTEXT';
  return 'READY';
}

export function buildAutonomousTestPlan(input: AutonomousTestPlanInput): AutonomousTestPlan {
  const key = cacheKey(input);
  const cached = planCache.get(key);
  if (cached) {
    cacheHits += 1;
    return { ...cached, id: `atest-cache-${cached.depth.toLowerCase()}`, generatedAt: Date.now() };
  }
  cacheMisses += 1;

  const reasoning: string[] = [];
  const riskScore = analyzeAutonomousTestRisk(input);
  const { depth, reasoning: depthReasoning } = selectAutonomousTestDepth(input, riskScore);
  const categories = selectAutonomousTestCategories(input);
  const suites = buildAutonomousTestSuites(categories, depth);
  const coverage = buildAutonomousTestCoverageModel(input, categories);
  const confidence = analyzeAutonomousTestConfidence(input, depth, categories, riskScore);
  const cost = analyzeAutonomousTestCost(suites.requiredSuites, suites.optionalSuites, depth);

  const draft = {
    depth,
    categories,
    requiredSuites: suites.requiredSuites,
    optionalSuites: suites.optionalSuites,
    coverageTargets: coverage.coverageTargets,
    executionOrder: suites.executionOrder,
    estimatedCost: cost.estimatedCost,
    estimatedDurationMs: cost.estimatedDurationMs,
    riskScore,
    confidence,
    reasoning: [...depthReasoning, ...coverage.missingCoverage.slice(0, 2)],
  };

  const readiness = evaluateAutonomousTestReadiness(input, draft);
  const depthEntry = getAutonomousTestDepthEntry(depth);
  if (confidence < (depthEntry?.minimumConfidence ?? 65)) {
    reasoning.push(`Confidence ${confidence} below depth minimum ${depthEntry?.minimumConfidence}`);
  }

  const plan: AutonomousTestPlan = {
    id: `atest-${Date.now()}-${depth.toLowerCase()}`,
    ...draft,
    readiness,
    reasoning: [...draft.reasoning, ...reasoning],
    generatedAt: Date.now(),
  };

  if (planCache.size >= MAX_PLAN_CACHE) {
    const first = planCache.keys().next().value;
    if (first) planCache.delete(first);
  }
  planCache.set(key, plan);

  return plan;
}

export function getAutonomousTestPlanCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetAutonomousTestPlannerForTests(): void {
  planCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
