/**
 * Decision risk evaluator — assesses risk levels for options and recommendations.
 */

import type { DecisionContext, DecisionIntent, DecisionOption } from './decision-types.js';
import type { RiskLevel } from '../foundation/types.js';

const RISK_ORDER: Record<RiskLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function evaluateOptionRisk(option: DecisionOption): RiskLevel {
  if (option.blocked && option.riskLevel === 'critical') return 'critical';
  if (option.blocked && RISK_ORDER[option.riskLevel] >= RISK_ORDER.high) return 'high';
  if (option.blockers.length >= 3) return 'high';
  if (option.blockers.length >= 1) return option.riskLevel === 'low' ? 'medium' : option.riskLevel;
  return option.riskLevel;
}

export function evaluateRecommendationRisk(
  primary: DecisionOption,
  context: DecisionContext,
): RiskLevel {
  let risk = evaluateOptionRisk(primary);

  if (context.intent === 'EXECUTION_NOW' || context.intent === 'CLOUD_RUNTIME_NOW') {
    risk = 'high';
  }
  if (context.intent === 'RISKY_MOVE') {
    const risky = context.riskFacts.length > 0 ? 'high' : 'medium';
    risk = RISK_ORDER[risk] > RISK_ORDER[risky] ? risk : risky;
  }
  if (context.intent === 'SAFE_MOVE' && !primary.blocked) {
    risk = 'low';
  }

  return risk;
}

export function findRiskiestOption(options: DecisionOption[]): DecisionOption | null {
  if (options.length === 0) return null;
  return [...options].sort((a, b) => RISK_ORDER[evaluateOptionRisk(b)] - RISK_ORDER[evaluateOptionRisk(a)])[0] ?? null;
}

export function findSafestOption(options: DecisionOption[]): DecisionOption | null {
  const safe = options.filter((o) => !o.blocked && evaluateOptionRisk(o) === 'low');
  if (safe.length > 0) {
    return safe.sort((a, b) => b.priority - a.priority)[0] ?? null;
  }
  return options.find((o) => o.category === 'VALIDATE_FIRST') ?? null;
}

export function riskLevelLabel(risk: RiskLevel): string {
  return risk.charAt(0).toUpperCase() + risk.slice(1);
}
