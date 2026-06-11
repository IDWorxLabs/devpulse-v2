/**
 * DevPulse V2 Phase 11.1B — Command Center UX Stabilization manifest.
 * UI/UX constants only. No intelligence or execution.
 */

export const COMMAND_CENTER_UX_STABILIZATION_PASS_TOKEN =
  'DEVPULSE_V2_COMMAND_CENTER_UX_STABILIZATION_V1_PASS';

export const UX_CHAT_SCROLL_OWNER = 'chat-history';
export const UX_WELCOME_STATE_ID = 'chat-welcome-state';
export const UX_CHAT_INPUT_ID = 'chat-input';
export const UX_OPERATOR_FEED_BODY_ID = 'operator-feed-body';
export const UX_CHAT_MESSAGES_PANEL_ID = 'chat-messages-panel';

export const UX_WELCOME_COPY = {
  title: 'AiDevEngine',
  subtitle: 'Turn detailed product ideas into working applications',
  hint: 'Ask AiDevEngine about your project, roadmap, architecture, verification, or what to build next.',
} as const;

export const UX_LAYOUT_RULES = {
  chatFirst: true,
  pageScrollDisabled: true,
  inputFixed: true,
  welcomeHidesAfterFirstMessage: true,
  feedAutoScroll: true,
} as const;

export const UX_FORBIDDEN_CHAT_ONBOARDING = [
  'DevPulse V2 Command Center Runtime Shell',
  'Phase 11.1 Unified Command Center Brain is connected',
  'Ask: "What should we build next?"',
] as const;
