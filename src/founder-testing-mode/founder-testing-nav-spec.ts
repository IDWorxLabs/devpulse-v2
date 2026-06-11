/**
 * Founder Testing Mode — bounded navigation screen definitions.
 */

export interface FounderTestScreenSpec {
  viewId: string;
  label: string;
  titlePattern: string;
  containerId: string;
  purposeKeywords: string[];
  forbiddenInSurface?: string[];
  requiredMarkers?: string[];
}

export const FOUNDER_TEST_PROMPTS = [
  'What is AiDevEngine?',
  'What can I build here?',
  'Help me start a new app.',
  'How do I verify my project?',
  'What is Project Memory?',
  'What is Live Preview?',
  'What should I do next?',
] as const;

export const FOUNDER_TEST_SCREENS: readonly FounderTestScreenSpec[] = [
  {
    viewId: 'command-center',
    label: 'Command Center',
    titlePattern: 'AiDevEngine Command Center',
    containerId: 'chat-surface',
    purposeKeywords: ['AiDevEngine', 'Message AiDevEngine', 'welcome'],
    requiredMarkers: ['chat-input', 'chat-form'],
  },
  {
    viewId: 'projects',
    label: 'Projects',
    titlePattern: 'Projects',
    containerId: 'projects-surface',
    purposeKeywords: ['Projects', 'Get Started', 'Your Projects'],
  },
  {
    viewId: 'autonomous-builder',
    label: 'Autonomous Builder',
    titlePattern: 'Autonomous Builder',
    containerId: 'autonomous-builder-surface',
    purposeKeywords: ['Autonomous Builder', 'Readiness', 'does not overpromise'],
  },
  {
    viewId: 'live-preview',
    label: 'Live Preview',
    titlePattern: 'Live Preview',
    containerId: 'live-preview-surface',
    purposeKeywords: ['Preview Status', 'No Live Preview Running', 'Next action'],
  },
  {
    viewId: 'project-memory',
    label: 'Project Memory',
    titlePattern: 'Project Memory',
    containerId: 'project-memory-surface',
    purposeKeywords: ['Project Memory', 'everything AiDevEngine knows', 'Project Knowledge', 'Requirements'],
    forbiddenInSurface: ['section-stacks', 'validator-list', 'completed-stacks'],
  },
  {
    viewId: 'verification',
    label: 'Verification',
    titlePattern: 'Verification',
    containerId: 'verification-surface',
    purposeKeywords: ['Verification Readiness', 'System Diagnostics'],
    forbiddenInSurface: ['class="validator-list"', 'id="validator-list"'],
  },
  {
    viewId: 'notifications',
    label: 'Notifications',
    titlePattern: 'Notifications',
    containerId: 'notifications-surface',
    purposeKeywords: ['Notifications', 'notification'],
  },
  {
    viewId: 'project-insights',
    label: 'Project Insights',
    titlePattern: 'Project Insights',
    containerId: 'project-insights-surface',
    purposeKeywords: ['Project Insights', 'everything AiDevEngine thinks', 'Health', 'Risks', 'Launch Readiness'],
    forbiddenInSurface: ['section-stacks', 'id="validator-list"', 'Foundation Stacks'],
  },
  {
    viewId: 'system-diagnostics',
    label: 'System Diagnostics',
    titlePattern: 'System Diagnostics',
    containerId: 'section-system-diagnostics-hero',
    purposeKeywords: ['System Diagnostics', 'advanced', 'internal'],
    requiredMarkers: ['section-stacks', 'validator-list'],
  },
] as const;

export const GENERIC_PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /coming soon only/i,
  /todo: implement/i,
  /placeholder copy/i,
  /TBD surface/i,
] as const;

export const INTERNAL_ARCHITECTURE_LEAK_PATTERNS = [
  /devpulse_v2_/i,
  /owner_module/i,
  /FOUNDER_REALITY_SURFACE_PASS/i,
  /validate:[a-z-]+/i,
] as const;
