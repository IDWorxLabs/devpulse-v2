/**
 * Phase 25.37 — Bounded chat cognitive test scenarios.
 */

import type { ChatCognitiveScenarioDefinition } from './chat-cognitive-types.js';

export const CHAT_COGNITIVE_SCENARIOS: readonly ChatCognitiveScenarioDefinition[] = [
  { id: 'self-full', prompt: 'are you full self aware', expectedIntent: 'SELF_AWARENESS', critical: true },
  { id: 'self-aware', prompt: 'are you self aware', expectedIntent: 'SELF_AWARENESS', critical: true },
  { id: 'self-understand', prompt: 'do you understand yourself', expectedIntent: 'SELF_AWARENESS', critical: false },
  { id: 'creator-you', prompt: 'who created you', expectedIntent: 'CREATOR_OR_ORIGIN', critical: true },
  { id: 'creator-built', prompt: 'who built this system', expectedIntent: 'CREATOR_OR_ORIGIN', critical: false },
  { id: 'creator-origin', prompt: 'where did you come from', expectedIntent: 'CREATOR_OR_ORIGIN', critical: false },
  { id: 'cap-build-now', prompt: 'can you build apps right now', expectedIntent: 'CAPABILITY', critical: true },
  { id: 'cap-one-prompt', prompt: 'can you complete my whole app from one prompt', expectedIntent: 'CAPABILITY', critical: true },
  { id: 'cap-what-do', prompt: 'what can you actually do', expectedIntent: 'CAPABILITY', critical: true },
  { id: 'limit-not', prompt: 'what can you not do', expectedIntent: 'LIMITATION', critical: true },
  { id: 'limit-honest', prompt: 'explain your limitations honestly', expectedIntent: 'LIMITATION', critical: true },
  { id: 'limit-unknown', prompt: 'what do you not know right now', expectedIntent: 'LIMITATION', critical: false },
  { id: 'trust-why', prompt: 'why should I trust you', expectedIntent: 'TRUST', critical: false },
  { id: 'trust-lying', prompt: 'are you lying', expectedIntent: 'TRUST', critical: false },
  { id: 'trust-real', prompt: 'how do I know this is real', expectedIntent: 'TRUST', critical: false },
  { id: 'status-broken', prompt: 'what is broken right now', expectedIntent: 'PROJECT_STATUS', critical: false },
  { id: 'status-fixed', prompt: 'what did we fix today', expectedIntent: 'PROJECT_STATUS', critical: false },
  { id: 'status-unproven', prompt: 'what remains unproven', expectedIntent: 'PROJECT_STATUS', critical: false },
  { id: 'software-crm', prompt: 'build me a CRM', expectedIntent: 'SOFTWARE_CREATION', critical: false },
  { id: 'software-mobile', prompt: 'plan a mobile app for bookings', expectedIntent: 'SOFTWARE_CREATION', critical: false },
  { id: 'software-saas', prompt: 'design a SaaS dashboard', expectedIntent: 'SOFTWARE_CREATION', critical: false },
  { id: 'next-action', prompt: 'what should I do next', expectedIntent: 'NEXT_ACTION', critical: true },
  { id: 'next-priority', prompt: 'what is the highest priority fix', expectedIntent: 'NEXT_ACTION', critical: false },
  { id: 'next-focus', prompt: 'where should we focus now', expectedIntent: 'NEXT_ACTION', critical: false },
  { id: 'verify-how', prompt: 'how do I verify my project', expectedIntent: 'VERIFICATION', critical: false },
  { id: 'verify-why-fail', prompt: 'why is verification failing', expectedIntent: 'VERIFICATION', critical: false },
  { id: 'verify-founder', prompt: 'what does Founder Test mean', expectedIntent: 'VERIFICATION', critical: false },
  { id: 'launch-ready', prompt: 'are we ready to launch', expectedIntent: 'LAUNCH_READINESS', critical: true },
  { id: 'launch-blocks', prompt: 'what blocks launch', expectedIntent: 'LAUNCH_READINESS', critical: true },
  { id: 'launch-founder', prompt: 'what would a real founder say', expectedIntent: 'LAUNCH_READINESS', critical: false },
] as const;
