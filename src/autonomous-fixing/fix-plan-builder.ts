/**
 * Autonomous Fixing — fix plan builder pipeline.
 */

import { classifyFailure } from './failure-classifier.js';
import { analyzeRootCause } from './root-cause-analyzer.js';
import { generateRepairCandidates } from './repair-candidate-generator.js';
import { buildRollbackPlan } from './rollback-planner.js';
import { analyzeFixRisk } from './fix-risk-analyzer.js';
import { analyzeFixConfidence } from './fix-confidence-analyzer.js';
import { selectFixStrategy } from './fix-strategy-selector.js';
import { evaluateFixReadiness } from './fix-readiness-evaluator.js';
import type { FixPlan, FixPlanInput } from './autonomous-fixing-types.js';

let planCounter = 0;

export function buildFixPlan(input: FixPlanInput): FixPlan {
  const reasoning: string[] = [];

  const failureCategory = classifyFailure(input);
  reasoning.push(`Classified failure as ${failureCategory}`);

  const rootCause = analyzeRootCause(input, failureCategory);
  reasoning.push(`Root cause confidence: ${rootCause.confidence}`);

  const repairs = generateRepairCandidates(failureCategory, input);
  reasoning.push(`Generated ${repairs.length} repair candidate(s)`);

  const riskScore = analyzeFixRisk(input, failureCategory, rootCause, repairs);
  reasoning.push(`Risk score: ${riskScore}`);

  const rollback = buildRollbackPlan(input, failureCategory, rootCause, riskScore);
  reasoning.push(...rollback.reasoning);

  const confidence = analyzeFixConfidence(input, rootCause, repairs);
  reasoning.push(`Fix confidence: ${confidence}`);

  const strategy = selectFixStrategy(
    input,
    failureCategory,
    rootCause,
    repairs,
    rollback,
    confidence,
    riskScore,
  );
  reasoning.push(`Selected strategy: ${strategy}`);

  const readiness = evaluateFixReadiness(input, strategy, confidence, riskScore, repairs);
  reasoning.push(`Readiness: ${readiness}`);

  planCounter += 1;

  return {
    id: `fix-plan-${planCounter}`,
    failureCategory,
    strategy,
    confidence,
    riskScore,
    readiness,
    rootCauseCandidates: rootCause.probableCauses,
    repairCandidates: repairs.map((r) => r.description),
    rollbackRequired: rollback.rollbackRequired,
    reasoning,
    generatedAt: Date.now(),
  };
}

export function resetFixPlanCounterForTests(): void {
  planCounter = 0;
}
