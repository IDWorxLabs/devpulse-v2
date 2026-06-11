/**
 * Clarifying Question Live Gate — deterministic conversation and pipeline gate.
 */

import { createHash } from 'node:crypto';
import { CLARIFYING_QUESTION_CACHE_KEY_PREFIX } from './clarifying-question-bounds.js';
import {
  ARCHETYPE_QUESTION_OVERRIDES,
  LIVE_GATE_CATEGORY_DEFINITIONS,
  MAX_LIVE_GATE_CATEGORIES,
} from './clarifying-question-live-gate-categories.js';
import { buildClarifyingEvidenceText, listClarifyingAnswers, recordClarifyingAnswer } from './clarifying-question-live-gate-memory.js';
import type { ClarifyingQuestionPriority } from './clarifying-question-types.js';
import type {
  AssumptionPreventedEvent,
  ClarifyingLiveGateInput,
  ClarifyingLiveGateResult,
  LiveGateCategoryDefinition,
  LiveGateCategoryId,
  LiveGateQuestionDefinition,
  ProjectArchetype,
} from './clarifying-question-live-gate-types.js';

const LIVE_GATE_CACHE_PREFIX = `${CLARIFYING_QUESTION_CACHE_KEY_PREFIX}:live-gate`;
const MAX_LIVE_GATE_QUESTIONS = 8;

let liveGateEvaluationCount = 0;
let liveGateAssumptionPreventedCount = 0;

export function resetClarifyingLiveGateMetricsForTests(): void {
  liveGateEvaluationCount = 0;
  liveGateAssumptionPreventedCount = 0;
}

export function getClarifyingLiveGateMetrics(): {
  gateEvaluations: number;
  assumptionPreventedCount: number;
} {
  return {
    gateEvaluations: liveGateEvaluationCount,
    assumptionPreventedCount: liveGateAssumptionPreventedCount,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function detectProjectArchetype(text: string): ProjectArchetype {
  const normalized = text.toLowerCase();
  if (/\b(food delivery|delivery app|restaurant app|driver app)\b/.test(normalized)) {
    return 'FOOD_DELIVERY';
  }
  if (/\b(portfolio|personal website|showcase site)\b/.test(normalized)) {
    return 'PORTFOLIO_WEBSITE';
  }
  if (/\b(accounting|tax platform|audit log|bookkeeping|ledger)\b/.test(normalized)) {
    return 'ACCOUNTING_PLATFORM';
  }
  if (/\b(task management|todo app|project management)\b/.test(normalized)) {
    return 'TASK_MANAGEMENT';
  }
  if (/\b(expense tracker|expense tracking|expense app)\b/.test(normalized)) {
    return 'EXPENSE_TRACKER';
  }
  if (/\b(marketplace|multi-vendor|seller platform)\b/.test(normalized)) {
    return 'MARKETPLACE';
  }
  return 'GENERIC_APPLICATION';
}

function isCategoryApplicable(category: LiveGateCategoryDefinition, archetype: ProjectArchetype): boolean {
  return !category.skipArchetypes.includes(archetype);
}

export function detectLiveGateCategories(input: {
  evidenceText: string;
  archetype: ProjectArchetype;
}): {
  applicable: LiveGateCategoryId[];
  detected: LiveGateCategoryId[];
  missing: LiveGateCategoryId[];
} {
  const applicable = LIVE_GATE_CATEGORY_DEFINITIONS.filter((category) =>
    isCategoryApplicable(category, input.archetype),
  );
  const detected: LiveGateCategoryId[] = [];
  const missing: LiveGateCategoryId[] = [];

  for (const category of applicable) {
    if (category.detectionPatterns.some((pattern) => pattern.test(input.evidenceText))) {
      detected.push(category.id);
    } else {
      missing.push(category.id);
    }
  }

  if (/\bbuild (?:me )?(?:a|an|the)\b/i.test(input.evidenceText) && !detected.includes('SUCCESS_CRITERIA')) {
    detected.push('SUCCESS_CRITERIA');
    const index = missing.indexOf('SUCCESS_CRITERIA');
    if (index >= 0) missing.splice(index, 1);
  }

  return {
    applicable: applicable.map((category) => category.id),
    detected,
    missing,
  };
}

function contextualQuestion(
  category: LiveGateCategoryDefinition,
  archetype: ProjectArchetype,
): LiveGateQuestionDefinition {
  const override = ARCHETYPE_QUESTION_OVERRIDES[archetype]?.[category.id];
  return {
    category: category.id,
    priority: category.priority,
    question: override ?? category.question,
    whyItMatters: category.whyItMatters,
    consequenceIfAssumed: category.consequenceIfAssumed,
  };
}

export function generateLiveGateQuestions(input: {
  missing: LiveGateCategoryId[];
  archetype: ProjectArchetype;
}): LiveGateQuestionDefinition[] {
  const questions: LiveGateQuestionDefinition[] = [];

  for (const category of LIVE_GATE_CATEGORY_DEFINITIONS.filter(
    (entry) => entry.priority === 'CRITICAL' && entry.blocksPlanning,
  )) {
    if (!input.missing.includes(category.id)) continue;
    if (!isCategoryApplicable(category, input.archetype)) continue;
    if (questions.filter((item) => item.priority === 'CRITICAL').length >= 5) break;
    questions.push(contextualQuestion(category, input.archetype));
  }

  for (const category of LIVE_GATE_CATEGORY_DEFINITIONS.filter(
    (entry) => entry.priority !== 'CRITICAL' && entry.blocksPlanning,
  )) {
    if (!input.missing.includes(category.id)) continue;
    if (!isCategoryApplicable(category, input.archetype)) continue;
    if (questions.length >= MAX_LIVE_GATE_QUESTIONS) break;
    questions.push(contextualQuestion(category, input.archetype));
  }

  return questions.slice(0, MAX_LIVE_GATE_QUESTIONS);
}

export function buildAssumptionPreventedEvents(
  missing: LiveGateCategoryId[],
): AssumptionPreventedEvent[] {
  return missing
    .map((categoryId) => {
      const category = LIVE_GATE_CATEGORY_DEFINITIONS.find((entry) => entry.id === categoryId);
      if (!category) return null;
      return {
        eventType: 'ASSUMPTION_PREVENTED' as const,
        category: categoryId,
        assumption: category.assumptionIfGuessed,
        resolution: 'ASKED_USER' as const,
      };
    })
    .filter((entry): entry is AssumptionPreventedEvent => entry !== null);
}

export function formatClarificationPrompt(input: {
  archetype: ProjectArchetype;
  questions: LiveGateQuestionDefinition[];
}): string {
  if (input.questions.length === 0) {
    return 'I can help build this. Clarification is required before planning can continue.';
  }

  const grouped = new Map<string, LiveGateQuestionDefinition[]>();
  for (const question of input.questions) {
    const category = LIVE_GATE_CATEGORY_DEFINITIONS.find((entry) => entry.id === question.category);
    const label = category?.label ?? question.category;
    const bucket = grouped.get(label) ?? [];
    bucket.push(question);
    grouped.set(label, bucket);
  }

  const lines = ['I can help build this.', '', 'Before planning, I need clarification on several important areas:', ''];
  let index = 1;
  for (const [label, bucket] of grouped) {
    lines.push(`${index}. ${label}`);
    for (const question of bucket) {
      lines.push(`   * ${question.question}`);
    }
    lines.push('');
    index += 1;
  }
  lines.push('Once these are answered I can create a complete build plan.');
  return lines.join('\n');
}

function stableCacheKey(input: {
  requestId?: string;
  projectId?: string;
  evidenceText: string;
  score: number;
  blocked: boolean;
}): string {
  const digest = createHash('sha256')
    .update(
      [
        input.requestId ?? 'no-request',
        input.projectId ?? 'no-project',
        input.score,
        input.blocked ? 'blocked' : 'open',
        input.evidenceText.slice(0, 512),
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${LIVE_GATE_CACHE_PREFIX}:${digest}`;
}

export function evaluateClarifyingLiveGate(input: ClarifyingLiveGateInput): ClarifyingLiveGateResult {
  const archetype = detectProjectArchetype(input.userPrompt);
  const evidenceText = buildClarifyingEvidenceText({
    userPrompt: input.userPrompt,
    requestId: input.requestId,
    projectId: input.projectId,
    supplementalEvidence: input.supplementalEvidence,
  });
  const { applicable, detected, missing } = detectLiveGateCategories({ evidenceText, archetype });
  const answeredCategories = listClarifyingAnswers({
    requestId: input.requestId,
    projectId: input.projectId,
  }).map((entry) => entry.categoryId);
  const missingCriticalCategories = missing.filter((categoryId) => {
    const category = LIVE_GATE_CATEGORY_DEFINITIONS.find((entry) => entry.id === categoryId);
    return category?.priority === 'CRITICAL' && category.blocksPlanning;
  });
  const requirementCompletenessScore = clamp(
    applicable.length === 0 ? 0 : (detected.length / applicable.length) * 100,
  );
  const confidenceToProceed = clamp(
    requirementCompletenessScore - missingCriticalCategories.length * 8,
  );
  const planningBlocked = missingCriticalCategories.length > 0;
  const recommendedQuestions = planningBlocked ? generateLiveGateQuestions({ missing, archetype }) : [];
  const assumptionsPreventedEvents = buildAssumptionPreventedEvents(missing);
  const gateDecision: ClarifyingLiveGateResult['gateDecision'] = planningBlocked
    ? recommendedQuestions.length > 0
      ? 'ASK_QUESTIONS'
      : 'WAIT_FOR_ANSWERS'
    : 'PROCEED';
  const clarificationMessage = planningBlocked
    ? formatClarificationPrompt({ archetype, questions: recommendedQuestions })
    : 'Requirement evidence is sufficient to proceed to planning.';

  liveGateEvaluationCount += 1;
  liveGateAssumptionPreventedCount += assumptionsPreventedEvents.length;

  return {
    readOnly: true,
    planningBlocked,
    buildBlocked: planningBlocked,
    gateDecision,
    projectArchetype: archetype,
    applicableCategoryCount: applicable.length,
    detectedCategoryCount: detected.length,
    missingCategoryCount: missing.length,
    criticalMissingCount: missingCriticalCategories.length,
    requirementCompletenessScore,
    confidenceToProceed,
    answeredCategories,
    detectedCategories: detected,
    missingCategories: missing,
    missingCriticalCategories,
    recommendedQuestions,
    assumptionsPreventedEvents,
    clarificationMessage,
    cacheKey: stableCacheKey({
      requestId: input.requestId,
      projectId: input.projectId,
      evidenceText,
      score: requirementCompletenessScore,
      blocked: planningBlocked,
    }),
  };
}

export function canProceedToPlanning(input: ClarifyingLiveGateInput): boolean {
  return !evaluateClarifyingLiveGate(input).planningBlocked;
}

export function applyClarifyingAnswersToPrompt(input: {
  userPrompt: string;
  requestId?: string;
  projectId?: string;
  answers: ReadonlyArray<{ categoryId: LiveGateCategoryId; answer: string }>;
}): ClarifyingLiveGateResult {
  for (const answer of input.answers) {
    recordClarifyingAnswer({
      categoryId: answer.categoryId,
      answer: answer.answer,
      requestId: input.requestId,
      projectId: input.projectId,
    });
  }
  return evaluateClarifyingLiveGate({
    userPrompt: input.userPrompt,
    requestId: input.requestId,
    projectId: input.projectId,
  });
}
