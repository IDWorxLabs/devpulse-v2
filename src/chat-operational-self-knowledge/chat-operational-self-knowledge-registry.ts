/**
 * Chat Operational Self-Knowledge — constants and pass tokens.
 */

export const CHAT_OPERATIONAL_SELF_KNOWLEDGE_V1_PASS = 'CHAT_OPERATIONAL_SELF_KNOWLEDGE_V1_PASS';

export const CHAT_OPERATIONAL_TRUTH_SOURCE_SYNCHRONIZATION_V1_PASS =
  'CHAT_OPERATIONAL_TRUTH_SOURCE_SYNCHRONIZATION_V1_PASS';

export const LIVE_CHAT_OPERATIONAL_PATH_BYPASS_REPAIR_V1_PASS =
  'LIVE_CHAT_OPERATIONAL_PATH_BYPASS_REPAIR_V1_PASS';

export const CHAT_ROUTING_CONSISTENCY_AND_TRUTH_UNIFICATION_V1_PASS =
  'CHAT_ROUTING_CONSISTENCY_AND_TRUTH_UNIFICATION_V1_PASS';

export const OPERATIONAL_SELF_AWARENESS_STANDARD =
  'Operational self-knowledge means answering from DevPulse proof authorities — role, limits, launch blockers, and execution chain status — not consciousness or sentience.';

export const CONSCIOUSNESS_CLAIM_PATTERNS = [
  /\bi am (fully )?self-aware\b/i,
  /\bi am conscious\b/i,
  /\bi am sentient\b/i,
  /\bi have (a )?consciousness\b/i,
  /\bhuman-like consciousness\b/i,
  /\bi have feelings\b/i,
  /\bi experience emotions\b/i,
] as const;

export const CORE_CAPABILITY_DEFINITIONS = [
  { id: 'requirements_extraction', label: 'Requirements extraction' },
  { id: 'planning', label: 'Planning' },
  { id: 'build_materialization', label: 'Build materialization' },
  { id: 'runtime_execution', label: 'Runtime execution' },
  { id: 'preview_execution', label: 'Preview execution' },
  { id: 'verification_execution', label: 'Verification execution' },
  { id: 'launch_execution', label: 'Launch execution' },
  { id: 'repository_typecheck', label: 'Repository typecheck baseline' },
  { id: 'chat_intelligence', label: 'Chat operational intelligence' },
] as const;
