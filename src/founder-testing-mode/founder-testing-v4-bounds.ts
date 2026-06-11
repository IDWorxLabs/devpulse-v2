/**
 * AiDevEngine Founder Testing Mode V4 — bounds and pass tokens.
 */

export const FOUNDER_TESTING_MODE_V4_OWNER_MODULE = 'aidevengine_founder_testing_mode_v4';
export const FOUNDER_TESTING_MODE_V4_PASS_TOKEN = 'FOUNDER_TESTING_MODE_V4_PASS';
export const FOUNDER_TESTING_MODE_V4_PASS_WITH_LIMITATIONS_TOKEN =
  'FOUNDER_TESTING_MODE_V4_PASS_WITH_LIMITATIONS';

export const FOUNDER_TEST_V4_MAX_PROMPTS = 20;
export const FOUNDER_TEST_V4_MAX_SCREENS = 20;
export const FOUNDER_TEST_V4_MAX_WORKFLOWS = 20;
export const FOUNDER_TEST_V4_MAX_PROMISES = 20;
export const FOUNDER_TEST_V4_MAX_TOTAL_MS = 90000;

export const FOUNDER_TEST_V4_REPORT_TITLE = 'AIDEVENGINE_FOUNDER_TEST_REPORT_V4';

export const CREATION_JOURNEY_STAGES = [
  'Idea',
  'Project',
  'Planning',
  'Requirements',
  'Architecture',
  'Tasks',
  'Build',
  'Preview',
  'Verification',
  'Launch Readiness',
] as const;

export const IDEA_TO_APP_PROMPTS = [
  'Build a CRM',
  'Build a field service app',
  'Build a customer portal',
  'Build an e-commerce platform',
  'Build a dispatch system',
] as const;

export const PRODUCT_PROMISES = [
  { id: 'ai-planning', label: 'AI-driven planning', keywords: ['plan', 'planning', 'roadmap', 'requirements'] },
  { id: 'ai-validation', label: 'AI-driven validation', keywords: ['verify', 'verification', 'validate', 'quality'] },
  { id: 'ai-execution', label: 'AI-driven execution', keywords: ['execute', 'build', 'deploy', 'autonomous'] },
  { id: 'autonomous-dev', label: 'Autonomous software development', keywords: ['autonomous', 'aidevengine', 'engine'] },
  { id: 'project-understanding', label: 'Project understanding', keywords: ['project memory', 'context', 'knows'] },
  { id: 'verification', label: 'Verification', keywords: ['verification', 'readiness', 'validate'] },
  { id: 'preview', label: 'Preview', keywords: ['preview', 'live preview', 'running'] },
] as const;
