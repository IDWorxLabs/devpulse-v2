/**
 * Universal Build Pipeline Verification V1 — canonical build test prompts.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { UniversalBuildMatrixEntry } from './universal-build-pipeline-types.js';

/** LISA assistive regression prompt — shared canonical form for universal build matrix. */
export const UNIVERSAL_BUILD_LISA_PROMPT = `Build LISA — Locked In Syndrome App.

An assistive communication app for locked-in syndrome users that converts eye movement, gaze, and blinks into speech.

Mobile-first Android phone preview required.

Required modules:
* onboarding-calibration
* eye-tracking-board
* blink-input-engine
* gaze-keyboard
* text-to-speech
* quick-phrases
* caregiver-dashboard
* communication-history
* accessibility-settings
* emergency-speech

Do not use generic project management fallback.`;

function entry(
  categoryId: string,
  categoryLabel: string,
  prompt: string,
  expectedProfile: GeneratedAppProfile | 'ASSISTIVE_COMMUNICATION' | 'ASSISTIVE_COMMUNICATION_APP_V1',
  requiredModuleHints: readonly string[],
  isLisaRegression = false,
): UniversalBuildMatrixEntry {
  return {
    readOnly: true,
    categoryId,
    categoryLabel,
    prompt,
    expectedProfile,
    requiredModuleHints,
    isLisaRegression,
  };
}

export const UNIVERSAL_BUILD_PIPELINE_MATRIX: readonly UniversalBuildMatrixEntry[] = [
  entry(
    'assistive-mobile-accessibility',
    'Assistive / Mobile Accessibility App',
    UNIVERSAL_BUILD_LISA_PROMPT,
    'ASSISTIVE_COMMUNICATION_APP_V1',
    ['gaze-keyboard', 'blink-input-engine', 'text-to-speech', 'quick-phrases'],
    true,
  ),
  entry(
    'expense-tracker',
    'Expense Tracker',
    'Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.',
    'EXPENSE_TRACKER_WEB_V1',
    ['expenses', 'categories', 'reports'],
  ),
  entry(
    'e-commerce-store',
    'E-Commerce Store',
    'Build an e-commerce store with product catalog, shopping cart, checkout flow, and order history pages.',
    'GENERIC_CUSTOM_APP_V1',
    ['products', 'cart', 'checkout', 'orders'],
  ),
  entry(
    'saas-crm',
    'SaaS CRM',
    'Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.',
    'CRM_WEB_V1',
    ['customers', 'deals', 'activities', 'dashboard'],
  ),
  entry(
    'social-community',
    'Social / Community App',
    'Build a community app with user profiles, posts feed, comments, likes, and direct messages.',
    'GENERIC_CUSTOM_APP_V1',
    ['profiles', 'posts', 'comments', 'messages'],
  ),
  entry(
    'ai-chat-app',
    'AI Chat App',
    'Build an AI chat app with conversation threads, prompt input, model responses, and chat history sidebar.',
    'GENERIC_CUSTOM_APP_V1',
    ['conversations', 'chat-input', 'responses', 'history'],
  ),
  entry(
    'education-lms',
    'Education / LMS App',
    'Build an LMS with courses, lessons, student enrollments, quizzes, and progress tracking.',
    'SCHOOL_MANAGEMENT_WEB_V1',
    ['courses', 'lessons', 'enrollments', 'quizzes', 'progress'],
  ),
  entry(
    'healthcare-patient-portal',
    'Healthcare / Patient Portal',
    'Build a patient portal with appointments, medical records view, prescriptions list, and secure messaging.',
    'GENERIC_CUSTOM_APP_V1',
    ['appointments', 'records', 'prescriptions', 'messaging'],
  ),
  entry(
    'marketplace-app',
    'Marketplace App',
    'Build a marketplace for buyers and sellers with listings, search, seller profiles, and transaction checkout.',
    'GENERIC_CUSTOM_APP_V1',
    ['listings', 'search', 'sellers', 'checkout'],
  ),
  entry(
    'developer-api-dashboard',
    'Developer Tool / API Dashboard',
    'Build an API dashboard with API keys, request logs, usage metrics charts, and endpoint documentation browser.',
    'GENERIC_CUSTOM_APP_V1',
    ['api-keys', 'request-logs', 'metrics', 'documentation'],
  ),
  entry(
    'internal-hr-admin',
    'Internal HR / Admin Tool',
    'Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.',
    'CRM_WEB_V1',
    ['employees', 'onboarding', 'time-off', 'payroll'],
  ),
  entry(
    'simple-game-puzzle',
    'Simple Game / Puzzle App',
    'Build a puzzle game with level select, play board, score tracking, and restart controls.',
    'GENERIC_CUSTOM_APP_V1',
    ['levels', 'game-board', 'score', 'controls'],
  ),
] as const;

export function listUniversalBuildMatrixCategoryIds(): readonly string[] {
  return UNIVERSAL_BUILD_PIPELINE_MATRIX.map((e) => e.categoryId);
}

export function resolveUniversalBuildMatrixEntry(categoryId?: string | null): UniversalBuildMatrixEntry {
  if (categoryId) {
    const match = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === categoryId);
    if (match) return match;
  }
  return UNIVERSAL_BUILD_PIPELINE_MATRIX[0]!;
}
