/**
 * Engineering Intelligence Runtime V1 — validation helpers.
 */

import { UNIVERSAL_BUILD_PIPELINE_MATRIX } from '../universal-build-pipeline-verification/universal-build-pipeline-matrix.js';
import type {
  EngineeringIntelligenceValidationMatrixEntry,
  ProductDomain,
} from './engineering-intelligence-types.js';

export const ENGINEERING_INTELLIGENCE_VALIDATION_MATRIX: readonly EngineeringIntelligenceValidationMatrixEntry[] = [
  {
    readOnly: true,
    label: 'E-commerce store',
    prompt:
      UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'e-commerce-store')?.prompt ??
      'Build an e-commerce store with product catalog, shopping cart, checkout flow, and order history pages.',
    expectedDomain: 'e-commerce',
    expectedModuleHints: ['products', 'cart', 'checkout', 'orders'],
  },
  {
    readOnly: true,
    label: 'AI chat app',
    prompt:
      UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'ai-chat-app')?.prompt ??
      'Build an AI chat app with conversation threads, prompt input, model responses, and chat history sidebar.',
    expectedDomain: 'ai-chat',
    expectedModuleHints: ['conversations', 'chat-input', 'responses', 'history'],
  },
  {
    readOnly: true,
    label: 'Internal HR/admin',
    prompt:
      UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'internal-hr-admin')?.prompt ??
      'Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.',
    expectedDomain: 'hr-admin',
    expectedModuleHints: ['employees', 'onboarding', 'time-off', 'payroll'],
  },
  {
    readOnly: true,
    label: 'Assistive communication',
    prompt:
      UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'assistive-mobile-accessibility')?.prompt ??
      'Build an assistive communication app with calibration, blink simulation, gaze board, text-to-speech, and accessibility settings.',
    expectedDomain: 'assistive-communication',
    expectedModuleHints: [
      'onboarding-calibration',
      'blink-input-engine',
      'eye-tracking-board',
      'text-to-speech',
      'accessibility-settings',
    ],
  },
  {
    readOnly: true,
    label: 'Expense tracker',
    prompt:
      UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'expense-tracker')?.prompt ??
      'Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.',
    expectedDomain: 'finance-expense',
    expectedModuleHints: ['expenses', 'categories'],
  },
  {
    readOnly: true,
    label: 'SaaS CRM',
    prompt:
      UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'saas-crm')?.prompt ??
      'Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.',
    expectedDomain: 'crm',
    expectedModuleHints: ['customers', 'deals', 'activities', 'dashboard'],
  },
];

export function moduleHintsPresent(
  moduleIds: readonly string[],
  hints: readonly string[],
): boolean {
  return hints.every((hint) => moduleIds.some((moduleId) => moduleId.includes(hint) || hint.includes(moduleId)));
}

export function domainMatchesExpected(detected: ProductDomain, expected: ProductDomain): boolean {
  return detected === expected;
}

export function sourceContainsAppSpecificHardcoding(source: string): boolean {
  return /\bLISA\b/.test(source) || /\bLocked In Syndrome App\b/.test(source);
}

export const RICH_PRODUCT_PROMPT_WITHOUT_AUTH =
  'Build an e-commerce store with product catalog, shopping cart, checkout flow, and order history pages.';

export const GENERIC_COLLAPSE_MODULE_PLAN = ['dashboard', 'settings'] as const;
