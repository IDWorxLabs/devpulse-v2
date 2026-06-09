/**
 * Decision recommendation engine — selects primary advisory recommendation.
 */

import { analyzeBlockers, blockersForOption } from './decision-blocker-detector.js';
import {
  evaluateRecommendationRisk,
  findRiskiestOption,
  findSafestOption,
  riskLevelLabel,
} from './decision-risk-evaluator.js';
import {
  rankDecisionOptions,
  selectBestRiskReward,
  selectHighestPriority,
  selectLowestPriority,
} from './decision-priority-ranker.js';
import type {
  DecisionConfidence,
  DecisionContext,
  DecisionOption,
  DecisionRecommendation,
} from './decision-types.js';

function buildWhy(primary: DecisionOption, context: DecisionContext, blockers: string[]): string {
  const parts: string[] = [];

  if (context.intent === 'EXECUTION_NOW') {
    parts.push(
      'Execution depends on stronger decision, development reasoning, verification, and controlled authorization layers.',
    );
  } else if (context.intent === 'CLOUD_RUNTIME_NOW') {
    parts.push('Cloud runtime requires stable local intelligence, governed execution readiness, and founder trust gates.');
  } else if (context.intent === 'DEVELOPMENT_REASONING_NOW') {
    parts.push('Development Reasoning is planned after Unified Decision Layer — it is not implemented yet.');
  } else if (context.intent === 'DO_NOT_BUILD') {
    parts.push('Premature capability introduction would bypass governance gates and erode founder trust.');
  } else if (context.intent === 'SAFE_MOVE') {
    parts.push('The safest move advances validated intelligence foundations without introducing execution risk.');
  } else if (context.intent === 'RISKY_MOVE') {
    parts.push('The riskiest move introduces execution, cloud, or autonomous building before prerequisites complete.');
  } else if (context.intent === 'BLOCKED_ITEMS') {
    parts.push('Registered blockers reflect constitutional deferral of execution and premature runtime connection.');
  } else if (context.intent === 'VALIDATE_FIRST') {
    parts.push('Validation confirms intelligence-only behavior before advancing the roadmap.');
  } else {
    parts.push(primary.description);
  }

  if (blockers.length > 0 && primary.blocked) {
    parts.push(`Blocked by: ${blockers.slice(0, 3).join('; ')}.`);
  }

  if (context.riskFacts.length > 0 && (primary.riskLevel === 'high' || primary.riskLevel === 'critical')) {
    parts.push(context.riskFacts[0]!);
  }

  return parts.join(' ');
}

function buildRecommendationText(primary: DecisionOption, context: DecisionContext): string {
  if (context.intent === 'EXECUTION_NOW') {
    return 'Not yet.';
  }
  if (context.intent === 'CLOUD_RUNTIME_NOW') {
    return 'Not yet — defer cloud runtime.';
  }
  if (context.intent === 'DEVELOPMENT_REASONING_NOW') {
    return 'Not yet — complete Unified Decision Layer first.';
  }
  if (context.intent === 'DO_NOT_BUILD' && primary.blocked) {
    return `Do not build ${primary.title.toLowerCase()} yet.`;
  }
  if (context.intent === 'RISKY_MOVE') {
    return `The riskiest next move is ${primary.title} — defer until foundations mature.`;
  }
  if (context.intent === 'SAFE_MOVE') {
    return primary.recommendedAction;
  }
  if (context.intent === 'BLOCKED_ITEMS') {
    return primary.blocked
      ? `${primary.title} is blocked — ${primary.recommendedAction}`
      : context.blockedItems.slice(0, 2).join('; ') || primary.recommendedAction;
  }
  if (context.intent === 'HIGHEST_PRIORITY') {
    return primary.recommendedAction;
  }
  if (context.intent === 'LOWEST_PRIORITY') {
    return `Lowest priority: ${primary.title} — ${primary.recommendedAction}`;
  }
  if (context.intent === 'RISK_REWARD') {
    return `Best risk/reward: ${primary.title} — ${primary.recommendedAction}`;
  }
  if (context.intent === 'FOUNDER_APPROVE') {
    return `Founder should approve: ${primary.recommendedAction}`;
  }
  if (context.intent === 'VALIDATE_FIRST') {
    return primary.recommendedAction;
  }
  if (context.intent === 'DEFER_ITEMS') {
    return `Defer: ${primary.title}. ${primary.recommendedAction}`;
  }

  return primary.recommendedAction;
}

function resolvePrimaryOption(
  ranked: DecisionOption[],
  context: DecisionContext,
): DecisionOption {
  switch (context.intent) {
    case 'SAFE_MOVE': {
      const safe = findSafestOption(ranked);
      if (safe) return safe;
      break;
    }
    case 'RISKY_MOVE': {
      const risky = findRiskiestOption(ranked);
      if (risky) return risky;
      break;
    }
    case 'HIGHEST_PRIORITY': {
      const high = selectHighestPriority(ranked);
      if (high) return high;
      break;
    }
    case 'LOWEST_PRIORITY': {
      const low = selectLowestPriority(ranked);
      if (low) return low;
      break;
    }
    case 'RISK_REWARD': {
      const best = selectBestRiskReward(ranked);
      if (best) return best;
      break;
    }
    case 'EXECUTION_NOW':
      return ranked.find((o) => o.title.toLowerCase().includes('execution')) ?? ranked[0]!;
    case 'CLOUD_RUNTIME_NOW':
      return ranked.find((o) => o.title.toLowerCase().includes('cloud')) ?? ranked[0]!;
    case 'DEVELOPMENT_REASONING_NOW':
      return ranked.find((o) => o.title.toLowerCase().includes('development reasoning')) ?? ranked[0]!;
    case 'BLOCKED_ITEMS':
      return ranked.find((o) => o.blocked) ?? ranked[0]!;
    case 'DO_NOT_BUILD':
      return ranked.find((o) => o.category === 'DO_NOT_BUILD_YET' || o.category === 'BLOCKED') ?? ranked[0]!;
    case 'VALIDATE_FIRST':
      return ranked.find((o) => o.category === 'VALIDATE_FIRST') ?? ranked[0]!;
    case 'DEFER_ITEMS':
      return ranked.find((o) => o.category === 'DEFER' || o.category === 'DO_NOT_BUILD_YET') ?? ranked[0]!;
    default:
      break;
  }

  return ranked[0]!;
}

function computeConfidence(primary: DecisionOption, context: DecisionContext): DecisionConfidence {
  if (primary.confidence === 'HIGH' && context.supportingFacts.length >= 2) return 'HIGH';
  if (context.intent === 'EXECUTION_NOW' || context.intent === 'CLOUD_RUNTIME_NOW') return 'HIGH';
  if (primary.supportingFacts.length >= 1 || context.supportingFacts.length >= 2) return 'MEDIUM';
  return 'LOW';
}

function nextSafeAction(primary: DecisionOption, context: DecisionContext, ranked: DecisionOption[]): string {
  if (context.intent === 'EXECUTION_NOW') {
    return 'Finish Unified Decision Layer, then Development Reasoning Foundation.';
  }
  if (primary.blocked) {
    const safe = findSafestOption(ranked);
    return safe?.recommendedAction ?? 'Advance validated intelligence foundations before blocked capabilities.';
  }
  return primary.recommendedAction;
}

export function generateDecisionRecommendation(
  options: DecisionOption[],
  context: DecisionContext,
): DecisionRecommendation {
  const ranked = rankDecisionOptions(options, context);
  const blockerAnalysis = analyzeBlockers(ranked, context);
  const primary = resolvePrimaryOption(ranked, context);
  const blockers = blockersForOption(blockerAnalysis, primary);
  const riskLevel = evaluateRecommendationRisk(primary, context);
  const confidence = computeConfidence(primary, context);

  const supportingFacts = [
    ...new Set([
      ...primary.supportingFacts,
      ...context.supportingFacts.slice(0, 4),
    ]),
  ].slice(0, 8);

  return {
    primaryOption: primary,
    rankedOptions: ranked,
    recommendation: buildRecommendationText(primary, context),
    why: buildWhy(primary, context, blockers),
    riskLevel,
    confidence,
    blockers,
    supportingFacts,
    nextSafeAction: nextSafeAction(primary, context, ranked),
  };
}

export function summarizeRecommendation(rec: DecisionRecommendation): string {
  return `${rec.recommendation} (Risk: ${riskLevelLabel(rec.riskLevel)}, Confidence: ${rec.confidence})`;
}
