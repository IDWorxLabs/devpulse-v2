/**
 * AiDevEngine Universal App Blueprint v1.0 — default planning questions.
 * Every app build should ask or infer these before materialization.
 */

export const UNIVERSAL_APP_BLUEPRINT_PLANNING_QUESTIONS = {
  business: [
    'What does the app do?',
    'Who are the users?',
    'Is login required?',
    'Is guest mode allowed?',
    'Is it free or paid?',
    'Is it mobile, web, or both?',
  ],
  design: ['Theme', 'Branding', 'Colors', 'Style'],
  data: [
    'What data is stored?',
    'Can users upload files?',
    'Are notifications needed?',
  ],
  ai: [
    'Is an AI assistant required?',
    'Are automations required?',
    'Should AI be visible globally or only inside certain features?',
  ],
} as const;

export const UNIVERSAL_APP_BLUEPRINT_DEFAULTS = {
  guestModeAllowed: true,
  onboardingEnabled: true,
  universalAiVisible: true,
  monetizationEnabled: false,
} as const;
