/**
 * Detect broad understanding dimensions from user questions.
 */

import type { QuestionDimension } from './general-question-types.js';
import { PROJECT_SEMANTIC_SIGNALS } from './general-question-types.js';

const DIMENSION_SIGNALS: Record<QuestionDimension, readonly string[]> = {
  PROJECT: [
    'devpulse',
    'this project',
    'project',
    'v2',
    'weakness',
    'weak at',
    'strong at',
    'holding back',
    'maturity',
    'readiness',
    'fail as a product',
    'autonomous building',
    'cloud runtime',
    'foundation',
    'not be built yet',
    'six months',
    'disappeared',
    'what should happen next',
    'what should we focus',
    'most important',
    'missing capability',
    'execution not connected',
    'furthest behind',
  ],
  SYSTEM: [
    'system',
    'systems',
    'furthest behind',
    'which system',
    'component',
    'module',
    'engine',
    'registry',
  ],
  ROADMAP: [
    'roadmap',
    'phase',
    'next phase',
    'before cloud',
    'cloud runtime',
    'focus before',
    'what should we build',
    'what should not be built',
    'foundation is most important',
  ],
  RISK: [
    'risk',
    'riskiest',
    'weakness',
    'weak at',
    'fail',
    'holding back',
    'blocker',
    'danger',
    'concern',
  ],
  DEPENDENCY: [
    'depend',
    'dependency',
    'depends on',
    'blocked by',
    'requires',
    'prerequisite',
    'before we can',
  ],
  IMPACT: [
    'impact',
    'affect',
    'what happens if',
    'consequence',
    'ripple',
  ],
  MEMORY: [
    'remember',
    'recall',
    'last time',
    'previously',
    'what did we decide',
    'what did we discuss',
    'history of',
  ],
  ARCHITECTURE: [
    'architecture',
    'design',
    'structure',
    'layer',
    'foundation',
    'constitution',
    'how is',
    'organized',
  ],
  PLANNING: [
    'plan',
    'planning',
    'focus',
    'next step',
    'what should',
    'prioritize',
    'six months',
    'disappeared',
    'what happens next',
    'before cloud',
    'should happen next',
    'focus on before',
  ],
  DEVELOPMENT: [
    'code',
    'implement',
    'build this',
    'refactor',
    'typescript',
    'function',
    'class',
    'api',
    'how do i',
    'how to write',
  ],
  DEBUGGING: [
    'debug',
    'bug',
    'error',
    'stack trace',
    'why does this fail',
    'not working',
    'broken',
    'fix this',
  ],
  EXECUTION: [
    'execution',
    'execute',
    'run this',
    'runtime',
    'not connected',
    'execution not connected',
    'deploy',
    'spawn',
  ],
  UNKNOWN: [],
};

function hasAny(lower: string, signals: readonly string[]): boolean {
  return signals.some((s) => lower.includes(s));
}

function hasProjectSemanticSignal(lower: string): boolean {
  return PROJECT_SEMANTIC_SIGNALS.some((s) => lower.includes(s));
}

export function detectQuestionDimensions(question: string): QuestionDimension[] {
  const lower = question.toLowerCase().trim();
  const dimensions: QuestionDimension[] = [];

  for (const [dimension, signals] of Object.entries(DIMENSION_SIGNALS) as Array<
    [QuestionDimension, readonly string[]]
  >) {
    if (dimension === 'UNKNOWN') continue;
    if (hasAny(lower, signals)) {
      dimensions.push(dimension);
    }
  }

  if (hasProjectSemanticSignal(lower) && !dimensions.includes('PROJECT')) {
    dimensions.push('PROJECT');
  }

  if (lower.includes('status') && !dimensions.includes('PROJECT')) {
    dimensions.push('PROJECT');
  }

  if (dimensions.length === 0) {
    dimensions.push('UNKNOWN');
  }

  return [...new Set(dimensions)];
}

export function isBroadProjectQuestion(question: string, dimensions: QuestionDimension[]): boolean {
  const lower = question.toLowerCase();
  if (dimensions.includes('PROJECT')) return true;
  if (hasProjectSemanticSignal(lower)) return true;
  if (lower.includes('devpulse')) return true;
  if (lower.includes('this project')) return true;
  return false;
}

export function isPlanningNotImpactQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  if (lower.includes('disappeared') || lower.includes('six months')) return true;
  if (lower.includes('what should happen next')) return true;
  if (lower.includes('what should we focus')) return true;
  if (lower.includes('focus on before')) return true;
  return false;
}
