/**
 * Chat Intelligence Reality — bounded evaluation limits and pass tokens.
 */

export const CHAT_INTELLIGENCE_REALITY_PASS_TOKEN = 'CHAT_INTELLIGENCE_REALITY_PASS';
export const CHAT_INTELLIGENCE_REALITY_OWNER_MODULE = 'aidevengine_chat_intelligence_reality';
export const MAX_CHAT_INTELLIGENCE_SCENARIOS = 10;
export const MAX_CHAT_FAILURE_HISTORY = 24;
export const CHAT_SELF_EVOLUTION_FAILURE_THRESHOLD = 3;
export const CHAT_INTELLIGENCE_LAUNCH_PASS_SCORE = 75;
export const CHAT_INTELLIGENCE_LAUNCH_BLOCK_SCORE = 55;

export const CHAT_INTELLIGENCE_PROOF_NOTES = [
  '"Chat exists" is not proof.',
  '"Response returned" is not proof.',
  '"Brain route available" is not proof.',
  'Only useful, grounded, purpose-aware answers count as proof.',
] as const;

export const CHAT_INTELLIGENCE_CACHE_KEY_PREFIX = 'chat-intelligence-reality-v1';
