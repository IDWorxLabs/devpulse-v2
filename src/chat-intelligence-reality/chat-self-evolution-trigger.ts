/**
 * Chat Self-Evolution Trigger — bounded diagnostic escalation for repeated chat failures.
 */

import {
  CHAT_SELF_EVOLUTION_FAILURE_THRESHOLD,
  MAX_CHAT_FAILURE_HISTORY,
} from './chat-intelligence-reality-bounds.js';
import type {
  ChatIntelligenceFailureCategory,
  ChatIntelligenceMissingCapability,
  ChatIntelligenceScenarioResult,
  ChatSelfEvolutionImprovementStep,
  ChatSelfEvolutionTriggerResult,
} from './chat-intelligence-reality-types.js';

const CATEGORY_TO_CAPABILITY: Record<ChatIntelligenceFailureCategory, ChatIntelligenceMissingCapability[]> = {
  GENERIC_ONBOARDING: ['RESPONSE_POLICY', 'PROMPT'],
  UNANSWERED_QUESTION: ['ROUTING', 'PROMPT'],
  FAKE_CONFIDENCE: ['RESPONSE_POLICY', 'VALIDATOR_COVERAGE'],
  WEAK_PURPOSE: ['PROMPT', 'BRAIN_CONNECTION'],
  DISCONNECTED_CONTEXT: ['CONTEXT', 'PROJECT_STATE', 'BRAIN_CONNECTION'],
  MISSING_SELF_DIAGNOSIS: ['PROMPT', 'RESPONSE_POLICY'],
  HALLUCINATED_READINESS: ['VALIDATOR_COVERAGE', 'RESPONSE_POLICY', 'PROJECT_STATE'],
  PRETEND_SMART: ['RESPONSE_POLICY', 'PROMPT'],
};

const failureHistory = new Map<ChatIntelligenceFailureCategory, number>();

export function resetChatSelfEvolutionForTests(): void {
  failureHistory.clear();
}

function recordFailures(categories: ChatIntelligenceFailureCategory[]): void {
  for (const category of categories) {
    failureHistory.set(category, (failureHistory.get(category) ?? 0) + 1);
    if (failureHistory.size > MAX_CHAT_FAILURE_HISTORY) {
      const oldest = failureHistory.keys().next().value;
      if (oldest) failureHistory.delete(oldest);
    }
  }
}

function classifyMissingCapabilities(
  category: ChatIntelligenceFailureCategory,
): ChatIntelligenceMissingCapability[] {
  return CATEGORY_TO_CAPABILITY[category] ?? ['RESPONSE_POLICY'];
}

function buildImprovementPlan(
  category: ChatIntelligenceFailureCategory,
  capabilities: ChatIntelligenceMissingCapability[],
): ChatSelfEvolutionImprovementStep[] {
  const steps: ChatSelfEvolutionImprovementStep[] = [
    {
      priority: 'HIGH',
      missingCapability: capabilities[0] ?? 'RESPONSE_POLICY',
      action: `Stop repeating the same ${category.toLowerCase().replace(/_/g, ' ')} fix path — classify root cause first.`,
      rationale: `Category "${category}" failed ${CHAT_SELF_EVOLUTION_FAILURE_THRESHOLD}+ times in bounded history.`,
    },
  ];

  if (capabilities.includes('PROMPT')) {
    steps.push({
      priority: 'HIGH',
      missingCapability: 'PROMPT',
      action: 'Revise chat prompt policy so direct founder questions receive direct answers, not onboarding menus.',
      rationale: 'Repeated generic or evasive responses indicate prompt policy failure.',
    });
  }
  if (capabilities.includes('ROUTING')) {
    steps.push({
      priority: 'HIGH',
      missingCapability: 'ROUTING',
      action: 'Audit brain routing so intelligence, purpose, and readiness questions reach the correct response authority.',
      rationale: 'Unanswered questions often mean the wrong handler answered.',
    });
  }
  if (capabilities.includes('CONTEXT') || capabilities.includes('PROJECT_STATE')) {
    steps.push({
      priority: 'MEDIUM',
      missingCapability: capabilities.includes('CONTEXT') ? 'CONTEXT' : 'PROJECT_STATE',
      action: 'Connect chat responses to current project state, disconnected systems, and verification evidence.',
      rationale: 'Founder questions about project health require grounded workspace context.',
    });
  }
  if (capabilities.includes('VALIDATOR_COVERAGE')) {
    steps.push({
      priority: 'MEDIUM',
      missingCapability: 'VALIDATOR_COVERAGE',
      action: 'Extend founder testing and chat validators to block launch when readiness claims are ungrounded.',
      rationale: 'Hallucinated readiness requires validator enforcement, not UI existence checks.',
    });
  }
  if (capabilities.includes('RESPONSE_POLICY')) {
    steps.push({
      priority: 'MEDIUM',
      missingCapability: 'RESPONSE_POLICY',
      action: 'Require operational self-awareness: role, limits, unknowns, and escalation — never fake confidence.',
      rationale: 'Response policy must enforce honesty over performative intelligence.',
    });
  }

  return steps.slice(0, 5);
}

export function evaluateChatSelfEvolutionTrigger(
  failedScenarios: ChatIntelligenceScenarioResult[],
): ChatSelfEvolutionTriggerResult {
  const categoriesThisRun = failedScenarios.flatMap((s) => s.failureCategories);
  recordFailures(categoriesThisRun);

  let repeatedCategory: ChatIntelligenceFailureCategory | null = null;
  let failureCountInCategory = 0;

  for (const [category, count] of failureHistory.entries()) {
    if (count >= CHAT_SELF_EVOLUTION_FAILURE_THRESHOLD && count >= failureCountInCategory) {
      repeatedCategory = category;
      failureCountInCategory = count;
    }
  }

  const triggered = repeatedCategory !== null;
  const missingCapabilities = repeatedCategory
    ? classifyMissingCapabilities(repeatedCategory)
    : ([] as ChatIntelligenceMissingCapability[]);
  const improvementPlan = repeatedCategory
    ? buildImprovementPlan(repeatedCategory, missingCapabilities)
    : [];

  return {
    triggered,
    repeatedCategory,
    failureCountInCategory,
    stopRepeatingFixPath: triggered,
    missingCapabilities,
    improvementPlan,
    launchBlocked: triggered,
    advisoryOnly: true,
  };
}
