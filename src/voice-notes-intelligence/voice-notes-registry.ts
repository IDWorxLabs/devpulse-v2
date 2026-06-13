/**
 * Voice Notes Intelligence — registry constants (V1).
 */

export const VOICE_NOTES_INTELLIGENCE_PASS_TOKEN = 'VOICE_NOTES_INTELLIGENCE_V1_PASS';

export const VOICE_NOTES_INTELLIGENCE_OWNER_MODULE = 'voice-notes-intelligence';

export const VOICE_NOTES_INTELLIGENCE_PHASE = '26.24';

export const VOICE_NOTES_INTELLIGENCE_REPORT_TITLE = 'Voice Notes Intelligence Report';

export const MAX_VOICE_NOTES_HISTORY = 32;

export const SUPPORTED_VOICE_EXTENSIONS = ['MP3', 'WAV', 'M4A', 'OGG'] as const;

export const VOICE_INTENT_TYPES = [
  'BUILD_REQUEST',
  'FEATURE_REQUEST',
  'BUG_REPORT',
  'ROADMAP_REQUEST',
  'DESIGN_REQUEST',
  'PLANNING_REQUEST',
] as const;

export const REQUIREMENT_CATEGORIES = [
  'screens',
  'userRoles',
  'workflows',
  'businessRules',
  'integrations',
  'notifications',
  'authentication',
  'dataEntities',
] as const;

export const SAFETY_GUARANTEES = [
  'READ_ONLY_INTELLIGENCE',
  'NO_CODE_GENERATION',
  'NO_PROJECT_MODIFICATION',
  'NO_AUTONOMOUS_EXECUTION',
  'NO_FILE_MUTATION',
  'EVIDENCE_BASED_OUTPUTS_ONLY',
  'BOUNDED_ANALYSIS_HISTORY',
] as const;
