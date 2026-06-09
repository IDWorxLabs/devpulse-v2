/**
 * Select reasoning modes from dimensions and question signals.
 */

import type { QuestionDimension, ReasoningMode } from './general-question-types.js';

const DIMENSION_MODE_MAP: Partial<Record<QuestionDimension, ReasoningMode[]>> = {
  PROJECT: ['DESCRIPTIVE', 'DIAGNOSTIC'],
  RISK: ['RISK_ASSESSMENT', 'PRIORITIZATION'],
  PLANNING: ['PLANNING', 'PRIORITIZATION'],
  DEPENDENCY: ['DEPENDENCY_ANALYSIS'],
  IMPACT: ['IMPACT_ANALYSIS'],
  EXECUTION: ['EXPLANATION', 'DIAGNOSTIC'],
  DEBUGGING: ['DIAGNOSTIC', 'EXPLANATION'],
  DEVELOPMENT: ['EXPLANATION', 'DIAGNOSTIC'],
  SYSTEM: ['COMPARISON', 'PRIORITIZATION'],
  ROADMAP: ['PLANNING', 'PRIORITIZATION'],
  MEMORY: ['DESCRIPTIVE'],
  ARCHITECTURE: ['DESCRIPTIVE', 'EXPLANATION'],
};

const QUESTION_MODE_SIGNALS: Array<[readonly string[], ReasoningMode]> = [
  [['biggest', 'most important', 'furthest behind', 'riskiest', 'strongest', 'weakest'], 'PRIORITIZATION'],
  [['why', 'not connected', 'not yet'], 'EXPLANATION'],
  [['weakness', 'weak at', 'holding back', 'fail'], 'RISK_ASSESSMENT'],
  [['what should', 'focus', 'next', 'six months', 'disappeared'], 'PLANNING'],
  [['depend', 'dependency', 'blocked'], 'DEPENDENCY_ANALYSIS'],
  [['impact', 'affect', 'what happens if'], 'IMPACT_ANALYSIS'],
  [['compare', 'versus', 'vs'], 'COMPARISON'],
  [['debug', 'bug', 'error'], 'DIAGNOSTIC'],
];

export function selectReasoningModes(
  question: string,
  dimensions: QuestionDimension[],
): ReasoningMode[] {
  const lower = question.toLowerCase();
  const modes = new Set<ReasoningMode>();

  for (const dim of dimensions) {
    const mapped = DIMENSION_MODE_MAP[dim];
    if (mapped) {
      for (const mode of mapped) modes.add(mode);
    }
  }

  for (const [signals, mode] of QUESTION_MODE_SIGNALS) {
    if (signals.some((s) => lower.includes(s))) {
      modes.add(mode);
    }
  }

  if (dimensions.includes('EXECUTION') && lower.includes('not connected')) {
    modes.add('EXPLANATION');
    modes.add('LIMITATION_DISCLOSURE');
    modes.add('PLANNING');
  }

  if (modes.size === 0) {
    modes.add('DESCRIPTIVE');
  }

  return [...modes];
}
