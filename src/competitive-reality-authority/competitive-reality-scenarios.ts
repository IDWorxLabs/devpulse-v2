/**
 * Competitive Reality Authority — bounded comparison category definitions.
 */

import type { CompetitiveComparisonDefinition } from './competitive-reality-types.js';

export const COMPETITIVE_REALITY_COMPARISONS: readonly CompetitiveComparisonDefinition[] = [
  {
    id: 'general-ai-comparison',
    category: 'GENERAL_AI_COMPARISON',
    competitorType: 'GENERAL_AI',
    question: 'Why use AiDevEngine instead of a general AI?',
  },
  {
    id: 'coding-assistant-comparison',
    category: 'CODING_ASSISTANT_COMPARISON',
    competitorType: 'AI_CODING_ASSISTANT',
    question: 'Why use AiDevEngine instead of coding assistants?',
  },
  {
    id: 'app-builder-comparison',
    category: 'APP_BUILDER_COMPARISON',
    competitorType: 'APP_BUILDER',
    question: 'Why use AiDevEngine instead of app builders?',
  },
  {
    id: 'autonomous-agent-comparison',
    category: 'AUTONOMOUS_AGENT_COMPARISON',
    competitorType: 'AUTONOMOUS_AGENT',
    question: 'Why use AiDevEngine instead of autonomous builders?',
  },
  {
    id: 'manual-workflow-comparison',
    category: 'MANUAL_WORKFLOW_COMPARISON',
    competitorType: 'MANUAL_WORKFLOW',
    question: 'Why use AiDevEngine instead of doing everything manually?',
  },
] as const;
