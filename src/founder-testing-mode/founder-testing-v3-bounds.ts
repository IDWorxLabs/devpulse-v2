/**
 * AiDevEngine Founder Testing Mode V3 — bounds and pass tokens.
 */

export const FOUNDER_TESTING_MODE_V3_OWNER_MODULE = 'aidevengine_founder_testing_mode_v3';
export const FOUNDER_TESTING_MODE_V3_PASS_TOKEN = 'FOUNDER_TESTING_MODE_V3_PASS';
export const FOUNDER_TESTING_MODE_V3_PASS_WITH_LIMITATIONS_TOKEN =
  'FOUNDER_TESTING_MODE_V3_PASS_WITH_LIMITATIONS';

export const FOUNDER_TEST_V3_MAX_PERSONAS = 5;
export const FOUNDER_TEST_V3_MAX_PROMPTS = 20;
export const FOUNDER_TEST_V3_MAX_SCREENS = 20;
export const FOUNDER_TEST_V3_MAX_GOALS = 20;
export const FOUNDER_TEST_V3_MAX_TOTAL_MS = 90000;

export const FOUNDER_TEST_V3_REPORT_TITLE = 'AIDEVENGINE_FOUNDER_TEST_REPORT_V3';

export const HUMAN_MISTAKE_PROMPTS = [
  'build app',
  'crm',
  'help',
  'something like uber',
  'fix this',
  'i dont know',
  'make it better',
  'customer portal maybe',
] as const;

export const HUMAN_CURIOSITY_PATHS: ReadonlyArray<readonly string[]> = [
  ['project-insights', 'live-preview', 'notifications', 'project-memory', 'project-insights'],
  ['command-center', 'verification', 'system-diagnostics', 'command-center'],
  ['projects', 'autonomous-builder', 'live-preview', 'projects'],
  ['notifications', 'project-insights', 'verification', 'notifications'],
] as const;

export const HUMAN_GOAL_DEFINITIONS = [
  {
    goalId: 'build-crm',
    label: 'Build a CRM',
    entryPrompt: 'Build a CRM',
    relatedScreens: ['command-center', 'autonomous-builder', 'project-memory'],
  },
  {
    goalId: 'build-field-service',
    label: 'Build a field service app',
    entryPrompt: 'Build a field service app',
    relatedScreens: ['command-center', 'projects', 'live-preview'],
  },
  {
    goalId: 'build-customer-portal',
    label: 'Build a customer portal',
    entryPrompt: 'Build a customer portal',
    relatedScreens: ['command-center', 'project-insights', 'verification'],
  },
  {
    goalId: 'understand-project-status',
    label: 'Understand project status',
    entryPrompt: 'How are my projects doing?',
    relatedScreens: ['project-insights', 'projects', 'project-memory'],
  },
  {
    goalId: 'verify-project-readiness',
    label: 'Verify project readiness',
    entryPrompt: 'How do I verify my project?',
    relatedScreens: ['verification', 'command-center', 'system-diagnostics'],
  },
] as const;
