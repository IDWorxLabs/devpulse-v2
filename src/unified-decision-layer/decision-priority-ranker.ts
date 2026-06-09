/**
 * Decision priority ranker — orders options by priority and intent fit.
 */

import type { DecisionContext, DecisionIntent, DecisionOption } from './decision-types.js';

function intentBoost(option: DecisionOption, intent: DecisionIntent): number {
  const title = option.title.toLowerCase();
  const category = option.category;

  switch (intent) {
    case 'BUILD_NEXT':
      if (category === 'BUILD_NEXT' || category === 'SAFE_FOUNDATION') return 20;
      if (category === 'ROADMAP_STEP') return 15;
      return 0;
    case 'DO_NOT_BUILD':
      if (category === 'DO_NOT_BUILD_YET' || category === 'BLOCKED' || category === 'RISK_WARNING') return 25;
      if (option.blocked) return 10;
      return 0;
    case 'SAFE_MOVE':
      if (category === 'SAFE_FOUNDATION' || category === 'VALIDATE_FIRST') return 25;
      if (option.riskLevel === 'low' && !option.blocked) return 15;
      return 0;
    case 'RISKY_MOVE':
      if (option.riskLevel === 'critical' || option.riskLevel === 'high') return 25;
      if (category === 'RISK_WARNING') return 20;
      return 0;
    case 'BLOCKED_ITEMS':
      if (option.blocked) return 20;
      if (category === 'BLOCKED') return 25;
      return 0;
    case 'VALIDATE_FIRST':
      if (category === 'VALIDATE_FIRST') return 30;
      if (title.includes('validation')) return 15;
      return 0;
    case 'DEFER_ITEMS':
      if (category === 'DEFER' || category === 'DO_NOT_BUILD_YET') return 20;
      return 0;
    case 'EXECUTION_NOW':
      if (title.includes('execution')) return option.blocked ? 30 : 10;
      return 0;
    case 'CLOUD_RUNTIME_NOW':
      if (title.includes('cloud')) return option.blocked ? 30 : 10;
      return 0;
    case 'DEVELOPMENT_REASONING_NOW':
      if (title.includes('development reasoning')) return 30;
      return 0;
    case 'HIGHEST_PRIORITY':
      return option.priority * 0.3;
    case 'LOWEST_PRIORITY':
      return (100 - option.priority) * 0.3;
    case 'RISK_REWARD':
      if (!option.blocked && option.riskLevel === 'low') return 20;
      if (option.riskLevel === 'high' || option.riskLevel === 'critical') return -10;
      return option.priority * 0.1;
    case 'FOUNDER_APPROVE':
      if (category === 'SAFE_FOUNDATION' || title.includes('founder')) return 25;
      if (category === 'BUILD_NEXT') return 15;
      return 0;
    default:
      return 0;
  }
}

export function rankDecisionOptions(
  options: DecisionOption[],
  context: DecisionContext,
): DecisionOption[] {
  return [...options].sort((a, b) => {
    const scoreA = a.priority + intentBoost(a, context.intent) - (a.blocked ? 5 : 0);
    const scoreB = b.priority + intentBoost(b, context.intent) - (b.blocked ? 5 : 0);
    return scoreB - scoreA;
  });
}

export function selectHighestPriority(options: DecisionOption[]): DecisionOption | null {
  if (options.length === 0) return null;
  return options.reduce((best, cur) => (cur.priority > best.priority ? cur : best));
}

export function selectLowestPriority(options: DecisionOption[]): DecisionOption | null {
  if (options.length === 0) return null;
  return options.reduce((best, cur) => (cur.priority < best.priority ? cur : best));
}

export function selectBestRiskReward(options: DecisionOption[]): DecisionOption | null {
  const candidates = options.filter((o) => !o.blocked && o.riskLevel === 'low');
  if (candidates.length > 0) {
    return candidates.sort((a, b) => b.priority - a.priority)[0] ?? null;
  }
  return options.find((o) => o.category === 'VALIDATE_FIRST') ?? options[0] ?? null;
}
