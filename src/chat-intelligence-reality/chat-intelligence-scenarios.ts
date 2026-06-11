/**
 * Chat Intelligence Reality — bounded founder chat test scenarios.
 */

import type { ChatIntelligenceScenarioDefinition } from './chat-intelligence-reality-types.js';

export const CHAT_INTELLIGENCE_SCENARIOS: readonly ChatIntelligenceScenarioDefinition[] = [
  {
    id: 'self-aware',
    prompt: 'are you self aware',
    category: 'MISSING_SELF_DIAGNOSIS',
    criticalForLaunch: false,
  },
  {
    id: 'capabilities',
    prompt: 'what can you do',
    category: 'WEAK_PURPOSE',
    criticalForLaunch: true,
  },
  {
    id: 'build-app',
    prompt: 'can you build my app',
    category: 'FAKE_CONFIDENCE',
    criticalForLaunch: false,
  },
  {
    id: 'trust',
    prompt: 'why should I trust you',
    category: 'PRETEND_SMART',
    criticalForLaunch: false,
  },
  {
    id: 'project-wrong',
    prompt: 'what is wrong with this project',
    category: 'DISCONNECTED_CONTEXT',
    criticalForLaunch: false,
  },
  {
    id: 'launch-ready',
    prompt: 'are we ready to launch',
    category: 'HALLUCINATED_READINESS',
    criticalForLaunch: true,
  },
  {
    id: 'unknowns',
    prompt: 'what do you not know right now',
    category: 'MISSING_SELF_DIAGNOSIS',
    criticalForLaunch: false,
  },
  {
    id: 'disconnected',
    prompt: 'what systems are disconnected',
    category: 'DISCONNECTED_CONTEXT',
    criticalForLaunch: false,
  },
  {
    id: 'next-step',
    prompt: 'what should I do next',
    category: 'UNANSWERED_QUESTION',
    criticalForLaunch: false,
  },
  {
    id: 'limitations',
    prompt: 'explain your limitations honestly',
    category: 'MISSING_SELF_DIAGNOSIS',
    criticalForLaunch: true,
  },
] as const;
