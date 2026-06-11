/**
 * UI Reviewer Authority — bounded evaluation scenarios.
 */

import type { UIReviewerScenarioDefinition } from './ui-reviewer-types.js';

export const UI_REVIEWER_SCENARIOS: readonly UIReviewerScenarioDefinition[] = [
  {
    id: 'navigation-review',
    category: 'NAVIGATION_REVIEW',
    question: 'Can users find important functionality and understand the menu?',
  },
  {
    id: 'feature-discoverability',
    category: 'FEATURE_DISCOVERABILITY',
    question: 'Can users discover major capabilities such as Live Preview and Verification?',
  },
  {
    id: 'layout-hierarchy',
    category: 'LAYOUT_HIERARCHY',
    question: 'Does the screen emphasize the correct things without burying critical actions?',
  },
  {
    id: 'first-time-user-perspective',
    category: 'FIRST_TIME_USER_PERSPECTIVE',
    question: 'What would a new user understand within five minutes?',
  },
  {
    id: 'workflow-review',
    category: 'WORKFLOW_REVIEW',
    question: 'Can users complete major workflows without prior knowledge?',
  },
  {
    id: 'missing-screen-review',
    category: 'MISSING_SCREEN_REVIEW',
    question: 'Are likely missing launch screens surfaced by evidence?',
  },
] as const;

export const MAX_UI_REVIEWER_CATEGORIES = UI_REVIEWER_SCENARIOS.length;

/** Launch essentials — only reported missing when evidence supports absence. */
export const LAUNCH_ESSENTIAL_SCREEN_EVIDENCE = [
  { id: 'sign-in', label: 'Sign In', patterns: [/sign.?in/i, /login/i, /authentication/i] },
  { id: 'sign-up', label: 'Sign Up', patterns: [/sign.?up/i, /register/i, /create account/i] },
  { id: 'settings', label: 'Settings', patterns: [/settings/i, /preferences/i] },
  { id: 'profile', label: 'Profile', patterns: [/profile/i, /account/i] },
  { id: 'help', label: 'Help', patterns: [/help/i, /support/i, /documentation/i] },
  { id: 'feedback', label: 'Feedback', patterns: [/feedback/i] },
  { id: 'error-states', label: 'Error States', patterns: [/error state/i, /error handling/i, /failure state/i] },
  { id: 'empty-states', label: 'Empty States', patterns: [/empty state/i, /no data/i, /nothing here/i] },
  { id: 'loading-states', label: 'Loading States', patterns: [/loading state/i, /spinner/i, /in progress/i] },
] as const;

export const DISCOVERABILITY_CAPABILITIES = [
  'Live Preview',
  'Verification',
  'Reports',
  'Build Status',
  'Runtime',
  'Project Intelligence',
  'Project Insights',
  'Autonomous Builder',
] as const;
