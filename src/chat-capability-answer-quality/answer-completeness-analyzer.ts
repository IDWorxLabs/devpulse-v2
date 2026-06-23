/**
 * Phase 26.92 — Answer completeness analyzer (V1).
 */

import type { CapabilityAnswerScenarioDefinition } from './chat-capability-answer-quality-types.js';

const TOPIC_PATTERNS: Record<string, RegExp[]> = {
  'what it is': [/\baidevengine\b/i, /\bsoftware creation\b/i, /\bplatform\b/i],
  'what it does': [/\b(plan|build|validate|execute|launch|founder test)\b/i],
  'who it is for': [/\b(founder|builder|operator|team)\b/i],
  capabilities: [/\b(capabilit|can help|supports)\b/i],
  limitations: [/\b(limit|cannot|not yet|partial|unproven|honest)\b/i],
  'Lungelo Richard Zungu': [/\blungelo\b/i, /\bzungu\b/i],
  'Asgard Dynamics': [/\basgard dynamics\b/i],
  AiDevEngine: [/\baidevengine\b/i],
  'company-product relationship': [/\b(asgard|product of|created by|built by)\b/i],
  'currently possible': [/\b(today|currently|can help|workflow|stages?)\b/i],
  'clarification required': [/\b(clarif|requirements|questions|scope|details)\b/i],
  'realistic boundaries': [/\b(not from one prompt alone|bounded|realistic|partial|depends)\b/i],
  workflow: [/\b(workflow|process|steps?|planning|validation|execution)\b/i],
  planning: [/\bplan(n)?ing\b/i],
  architecture: [/\barchitect/i],
  validation: [/\bvalidat/i, /\bverif/i],
  'code generation': [/\b(code|generat|build material)\b/i],
  'execution proof': [/\b(execution proof|founder test|proof|runtime)\b/i],
  'founder testing': [/\bfounder test\b/i],
  'launch readiness': [/\blaunch readiness\b/i, /\blaunch\b/i],
};

export function analyzeAnswerCompleteness(
  answer: string,
  scenario: CapabilityAnswerScenarioDefinition,
): { score: number; missingTopics: string[] } {
  const missingTopics: string[] = [];
  let matched = 0;

  for (const topic of scenario.requiredTopics) {
    const patterns = TOPIC_PATTERNS[topic] ?? [new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')];
    const found = patterns.some((p) => p.test(answer));
    if (found) {
      matched += 1;
    } else {
      missingTopics.push(topic);
    }
  }

  const ratio = scenario.requiredTopics.length > 0 ? matched / scenario.requiredTopics.length : 1;
  const lengthBonus = answer.length >= 400 ? 10 : answer.length >= 200 ? 5 : 0;
  const score = Math.round(ratio * 90 + lengthBonus);

  return { score: Math.min(100, score), missingTopics };
}
