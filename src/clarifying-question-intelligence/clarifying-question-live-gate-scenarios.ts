/**
 * Clarifying Question Live Gate — founder test and validation scenarios.
 */

import type { ClarifyingLiveGateScenario } from './clarifying-question-live-gate-types.js';

export const CLARIFYING_LIVE_GATE_SCENARIOS: readonly ClarifyingLiveGateScenario[] = [
  {
    id: 'missing-authentication',
    prompt: 'Build me a food delivery app.',
    expectedMissingCategories: ['AUTHENTICATION'],
    expectedBlocked: true,
    answerPatch: {
      AUTHENTICATION: 'Email/password login with optional Google sign-in.',
    },
  },
  {
    id: 'missing-branding',
    prompt: 'Build me a task management app for teams on web.',
    expectedMissingCategories: ['BRANDING', 'COLOR_SCHEME'],
    expectedBlocked: true,
    answerPatch: {
      BRANDING: 'Use our existing Acme logo.',
      COLOR_SCHEME: 'Dark mode with blue accents.',
    },
  },
  {
    id: 'missing-platform-target',
    prompt: 'Build a marketplace for local services.',
    expectedMissingCategories: ['PLATFORM_TARGETS'],
    expectedBlocked: true,
    answerPatch: {
      PLATFORM_TARGETS: 'Web first with responsive mobile support.',
    },
  },
  {
    id: 'missing-permissions',
    prompt: 'Build an accounting platform for firms.',
    expectedMissingCategories: ['PERMISSIONS'],
    expectedBlocked: true,
    answerPatch: {
      PERMISSIONS: 'Accountants can edit, auditors read-only, admins manage users.',
    },
  },
  {
    id: 'missing-payment-model',
    prompt: 'Build a food delivery app for customers and drivers on mobile.',
    expectedMissingCategories: ['PAYMENTS'],
    expectedBlocked: true,
    answerPatch: {
      PAYMENTS: 'Stripe for card payments, cash option for selected regions.',
    },
  },
  {
    id: 'missing-security-requirements',
    prompt: 'Build an accounting platform with audit logs.',
    expectedMissingCategories: ['SECURITY_REQUIREMENTS'],
    expectedBlocked: true,
    answerPatch: {
      SECURITY_REQUIREMENTS: 'Encrypt financial records at rest and require MFA for admins.',
    },
  },
  {
    id: 'missing-admin-requirements',
    prompt: 'Build a marketplace with vendors and buyers.',
    expectedMissingCategories: ['ADMIN_REQUIREMENTS'],
    expectedBlocked: true,
    answerPatch: {
      ADMIN_REQUIREMENTS: 'Operations console for vendor approval and dispute moderation.',
    },
  },
  {
    id: 'portfolio-skips-marketplace-questions',
    prompt: 'Build a portfolio website to showcase design work.',
    expectedMissingCategories: ['COLOR_SCHEME', 'DEPLOYMENT_TARGETS'],
    expectedBlocked: true,
    answerPatch: {
      COLOR_SCHEME: 'Minimal black and white palette.',
      DEPLOYMENT_TARGETS: 'Public web launch.',
      SUCCESS_CRITERIA: 'Visitors can view projects and contact me.',
    },
  },
] as const;

export const CLARIFYING_LIVE_GATE_FOOD_DELIVERY_PROMPT = 'Build me a food delivery app.';

export const CLARIFYING_LIVE_GATE_COMPLETE_FOOD_DELIVERY_ANSWERS = {
  AUTHENTICATION: 'Email/password, Google, and Apple sign-in.',
  USER_ROLES: 'Customers, drivers, restaurants, and admins.',
  PERMISSIONS: 'Role-based access for each user type.',
  PLATFORM_TARGETS: 'Web, iOS, and Android.',
  PAYMENTS: 'Stripe and PayFast with cash-only option.',
  BRANDING: 'Use provided logo and brand name.',
  COLOR_SCHEME: 'Green and white with dark mode option.',
  DEPLOYMENT_TARGETS: 'Public launch on web and mobile.',
  FAILURE_HANDLING: 'Retry failed deliveries and notify support on repeated failures.',
  SECURITY_REQUIREMENTS: 'Encrypt customer data and require MFA for admin accounts.',
  SUCCESS_CRITERIA: 'Customers can order, drivers can deliver, restaurants can manage menus.',
} as const;
