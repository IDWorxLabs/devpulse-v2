/**
 * Phase 26.2 — Question-aware context source selection.
 */

import type { ContextSource } from './context-hydration-types.js';

const ALL_SOURCES: readonly ContextSource[] = [
  'IDENTITY',
  'SELF_MODEL',
  'CAPABILITY_BOUNDARIES',
  'PROJECT_VAULT',
  'FOUNDER_TEST',
  'EXECUTION_PROOF',
  'VERIFICATION',
  'WORKSPACE',
  'PROJECT_HISTORY',
  'LAUNCH_COUNCIL',
];

export function selectContextSourcesForMessage(message: string): ContextSource[] {
  const lower = message.toLowerCase();

  if (/\b(who created you|who built you|who are you|what are you)\b/i.test(lower)) {
    return ['IDENTITY', 'SELF_MODEL', 'CAPABILITY_BOUNDARIES'];
  }

  if (/\b(what is devpulse|what's devpulse|what was devpulse|devpulse history|legacy name)\b/i.test(lower)) {
    return ['IDENTITY', 'SELF_MODEL', 'PROJECT_HISTORY'];
  }

  if (/\b(what is aidevengine|what's aidevengine|tell me about aidevengine)\b/i.test(lower)) {
    return ['IDENTITY', 'SELF_MODEL', 'CAPABILITY_BOUNDARIES'];
  }

  if (/\b(what company|which company|part of what company|asgard)\b/i.test(lower)) {
    return ['IDENTITY', 'SELF_MODEL'];
  }

  if (
    /\b(weakness(?:es)?|weak point|where are you lacking|what are you bad at|what do you struggle|your capabilities|what can you do|how can you help|self aware|self-aware|sound human|robotic|humanistic)\b/i.test(
      lower,
    ) &&
    !/\b(project|devpulse|launch ready|blocking us)\b/i.test(lower)
  ) {
    return ['SELF_MODEL', 'CAPABILITY_BOUNDARIES'];
  }

  if (/\b(launch ready|are we ready|launch readiness|launch council|ready to launch)\b/i.test(lower)) {
    return ['FOUNDER_TEST', 'LAUNCH_COUNCIL', 'EXECUTION_PROOF', 'VERIFICATION', 'PROJECT_VAULT'];
  }

  if (/\b(what did we fix|fix today|what changed|recent phases|completed phases|history|checkpoint|rollback)\b/i.test(lower)) {
    return ['PROJECT_HISTORY', 'VERIFICATION', 'PROJECT_VAULT'];
  }

  if (/\b(verification|what failed|pass count|fail count|verify|unified verification)\b/i.test(lower)) {
    return ['VERIFICATION', 'FOUNDER_TEST', 'PROJECT_VAULT'];
  }

  if (/\b(blocking us|blockers|what is blocking|what blocks|what is broken|missing|what is wrong)\b/i.test(lower)) {
    return ['FOUNDER_TEST', 'EXECUTION_PROOF', 'VERIFICATION', 'LAUNCH_COUNCIL', 'PROJECT_VAULT', 'WORKSPACE'];
  }

  if (/\b(workspace|active project|active workspace)\b/i.test(lower)) {
    return ['WORKSPACE', 'PROJECT_VAULT'];
  }

  if (/\b(project status|devpulse|what is the project|project missing|project phase)\b/i.test(lower)) {
    return ['PROJECT_VAULT', 'FOUNDER_TEST', 'EXECUTION_PROOF', 'WORKSPACE'];
  }

  return ['IDENTITY', 'SELF_MODEL', 'CAPABILITY_BOUNDARIES', 'PROJECT_VAULT', 'FOUNDER_TEST'];
}

export function listAllContextSources(): readonly ContextSource[] {
  return ALL_SOURCES;
}
