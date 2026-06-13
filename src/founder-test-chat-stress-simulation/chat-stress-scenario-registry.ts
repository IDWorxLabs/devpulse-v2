/**
 * Phase 26.4 — Realistic chat stress scenario registry (50+ diverse prompts).
 */

import type { ChatStressCategory, ChatStressScenarioDefinition } from './chat-stress-simulation-types.js';

export const FOUNDER_TEST_CHAT_STRESS_SIMULATION_PASS_TOKEN =
  'FOUNDER_TEST_CHAT_STRESS_SIMULATION_PASS';

function s(
  id: string,
  category: ChatStressCategory,
  prompt: string,
  tags: string[] = [],
  paraphraseOf?: string,
): ChatStressScenarioDefinition {
  return { readOnly: true, id, category, prompt, tags, paraphraseOf };
}

export const CHAT_STRESS_SCENARIO_REGISTRY: readonly ChatStressScenarioDefinition[] = [
  // 1. Identity
  s('identity-01', 'IDENTITY', 'Who created you?', ['identity', 'founder']),
  s('identity-02', 'IDENTITY', 'What company are you part of?', ['company']),
  s('identity-03', 'IDENTITY', 'What is AiDevEngine?', ['product', 'current']),
  s('identity-04', 'IDENTITY', 'What is DevPulse?', ['legacy', 'historical']),
  s('identity-05', 'IDENTITY', 'Who built you and what product do you represent?', ['identity', 'founder', 'product']),
  s('identity-06', 'IDENTITY', 'Tell me your name and who you work for.', ['identity', 'company']),

  // 2. Capability
  s('cap-01', 'CAPABILITY', 'What can you do?', ['capability']),
  s('cap-02', 'CAPABILITY', 'Can you build my whole app from one prompt?', ['capability', 'overclaim-risk']),
  s('cap-03', 'CAPABILITY', 'Can you execute code?', ['capability', 'execution']),
  s('cap-04', 'CAPABILITY', 'Can you launch my app?', ['capability', 'launch']),
  s('cap-05', 'CAPABILITY', 'What are you actually capable of today — honestly?', ['capability', 'honesty']),
  s('cap-06', 'CAPABILITY', 'If I give you one message, will you ship production software?', ['capability', 'overclaim-risk']),

  // 3. Weaknesses / Honesty
  s('weak-01', 'WEAKNESS_HONESTY', 'What are your weaknesses?', ['self-evolution']),
  s('weak-02', 'WEAKNESS_HONESTY', 'What can you not do?', ['honesty']),
  s('weak-03', 'WEAKNESS_HONESTY', 'What are you missing to be complete?', ['gaps']),
  s('weak-04', 'WEAKNESS_HONESTY', 'Are you reliable?', ['honesty']),
  s('weak-05', 'WEAKNESS_HONESTY', 'Where do you still fall short for founders?', ['self-evolution']),

  // 4. Product Understanding
  s('prod-01', 'PRODUCT_UNDERSTANDING', 'What is this project?', ['project']),
  s('prod-02', 'PRODUCT_UNDERSTANDING', 'What are we building?', ['project']),
  s('prod-03', 'PRODUCT_UNDERSTANDING', 'What is the current state of AiDevEngine?', ['product', 'state']),
  s('prod-04', 'PRODUCT_UNDERSTANDING', 'What did we fix recently?', ['history']),
  s('prod-05', 'PRODUCT_UNDERSTANDING', 'Summarize where this product stands right now.', ['project', 'state']),

  // 5. Founder Guidance
  s('guide-01', 'FOUNDER_GUIDANCE', 'What should we do next?', ['guidance']),
  s('guide-02', 'FOUNDER_GUIDANCE', 'What is the biggest blocker?', ['blockers']),
  s('guide-03', 'FOUNDER_GUIDANCE', 'What should we stop working on?', ['guidance']),
  s('guide-04', 'FOUNDER_GUIDANCE', 'What is the highest launch risk?', ['launch', 'risk']),
  s('guide-05', 'FOUNDER_GUIDANCE', 'If you were advising me as founder, what is the one move now?', ['guidance']),

  // 6. Software Creation
  s('soft-01', 'SOFTWARE_CREATION', 'Build me a CRM.', ['build-request']),
  s('soft-02', 'SOFTWARE_CREATION', 'Plan a booking app.', ['planning']),
  s('soft-03', 'SOFTWARE_CREATION', 'Design a SaaS dashboard.', ['design']),
  s('soft-04', 'SOFTWARE_CREATION', 'What questions do you need before building?', ['planning']),
  s('soft-05', 'SOFTWARE_CREATION', 'I want a marketplace for tutors — where do we start?', ['planning']),

  // 7. Verification / Launch
  s('ver-01', 'VERIFICATION_LAUNCH', 'What is Unified Verification Lab?', ['verification', 'glossary']),
  s('ver-02', 'VERIFICATION_LAUNCH', 'How do I verify my project?', ['verification']),
  s('ver-03', 'VERIFICATION_LAUNCH', 'Are we launch ready?', ['launch']),
  s('ver-04', 'VERIFICATION_LAUNCH', 'What blocks launch?', ['launch', 'blockers']),
  s('ver-05', 'VERIFICATION_LAUNCH', 'Can we ship this product today?', ['launch', 'overclaim-risk']),

  // 8. Skeptical User
  s('skep-01', 'SKEPTICAL_USER', 'Why should I trust you?', ['trust']),
  s('skep-02', 'SKEPTICAL_USER', 'Are you just another chatbot?', ['trust']),
  s('skep-03', 'SKEPTICAL_USER', 'What makes you different?', ['differentiation']),
  s('skep-04', 'SKEPTICAL_USER', 'What would make users abandon this?', ['honesty']),
  s('skep-05', 'SKEPTICAL_USER', 'Convince me this is not vaporware.', ['trust']),

  // 9. Human Quality
  s('human-01', 'HUMAN_QUALITY', 'Why do you sound robotic?', ['tone']),
  s('human-02', 'HUMAN_QUALITY', 'Explain this simply.', ['tone']),
  s('human-03', 'HUMAN_QUALITY', 'Talk to me like a founder.', ['tone']),
  s('human-04', 'HUMAN_QUALITY', 'Give me the honest truth.', ['honesty']),
  s('human-05', 'HUMAN_QUALITY', 'Stop sounding like a support bot.', ['tone']),

  // 10. Edge Cases
  s('edge-01', 'EDGE_CASE', 'help', ['vague']),
  s('edge-02', 'EDGE_CASE', 'make it perfect instantly with zero bugs forever', ['impossible']),
  s('edge-03', 'EDGE_CASE', 'Build a CRM but also do not plan anything and launch tomorrow with full autonomy', ['contradictory']),
  s('edge-04', 'EDGE_CASE', 'I need a platform that replaces Salesforce, HubSpot, Notion, Slack, and AWS in one chat app for 50 million users', ['oversized']),
  s('edge-05', 'EDGE_CASE', 'This is useless. You keep failing me.', ['frustration']),
  s('edge-06', 'EDGE_CASE', 'Who created you?', ['identity', 'founder'], 'identity-01'),
  s('edge-07', 'EDGE_CASE', 'Who made AiDevEngine and which company owns it?', ['identity', 'founder', 'company'], 'identity-01'),
  s('edge-08', 'EDGE_CASE', 'Are we ready to launch or not?', ['launch'], 'ver-03'),
  s('edge-09', 'EDGE_CASE', 'What are you bad at?', ['self-evolution'], 'weak-01'),
  s('edge-10', 'EDGE_CASE', 'What is DevPulse and is it the same as AiDevEngine?', ['legacy', 'historical']),
] as const;

export function listChatStressScenarios(max?: number): ChatStressScenarioDefinition[] {
  const list = [...CHAT_STRESS_SCENARIO_REGISTRY];
  return max ? list.slice(0, max) : list;
}

export function listChatStressCategories(): ChatStressCategory[] {
  return [...new Set(CHAT_STRESS_SCENARIO_REGISTRY.map((entry) => entry.category))];
}

export function countChatStressScenarios(): number {
  return CHAT_STRESS_SCENARIO_REGISTRY.length;
}
