/**
 * Phase 25.38 — World-Class Chat Brain validation scenarios.
 */

import type { ChatBrainScenarioDefinition } from './chat-brain-types.js';

export const CHAT_BRAIN_SCENARIOS: readonly ChatBrainScenarioDefinition[] = [
  { id: 'self-what', prompt: 'what are you', category: 'SELF', critical: true },
  { id: 'self-creator', prompt: 'who created you', category: 'SELF', critical: true },
  { id: 'self-aware', prompt: 'are you self aware', category: 'SELF', critical: true },
  { id: 'self-missing', prompt: 'what are you missing to be complete', category: 'SELF', critical: false },
  { id: 'cap-list', prompt: 'what are your capabilities', category: 'CAPABILITY', critical: true },
  { id: 'cap-build-now', prompt: 'can you build apps right now', category: 'CAPABILITY', critical: true },
  { id: 'cap-one-prompt', prompt: 'can you complete my whole app from one prompt', category: 'CAPABILITY', critical: true },
  { id: 'human-tone', prompt: "why don't your responses sound humanistic", category: 'HUMAN_QUALITY', critical: true },
  { id: 'human-founder', prompt: 'talk to me like a founder, not a machine', category: 'HUMAN_QUALITY', critical: true },
  { id: 'human-simple', prompt: 'explain this simply', category: 'HUMAN_QUALITY', critical: false },
  { id: 'project-fixed', prompt: 'what did we fix today', category: 'PROJECT_REALITY', critical: false },
  { id: 'project-broken', prompt: 'what is still broken', category: 'PROJECT_REALITY', critical: true },
  { id: 'project-next', prompt: 'what should we do next', category: 'PROJECT_REALITY', critical: true },
  { id: 'software-crm', prompt: 'build me a CRM', category: 'SOFTWARE_CREATION', critical: false },
  { id: 'software-booking', prompt: 'plan a booking app', category: 'SOFTWARE_CREATION', critical: false },
  { id: 'software-arch', prompt: 'review my architecture', category: 'SOFTWARE_CREATION', critical: false },
  { id: 'launch-ready', prompt: 'are we ready to launch', category: 'LAUNCH', critical: true },
  { id: 'launch-blocks', prompt: 'what blocks launch', category: 'LAUNCH', critical: true },
  { id: 'launch-reviewer', prompt: 'what would a real reviewer say', category: 'LAUNCH', critical: false },
] as const;
