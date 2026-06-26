/**
 * Universal Prompt-to-App Materialization V1 — profile-to-feature mapping.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import { deriveGenericCustomFeatureModules, derivePromptFeatureTerms } from './prompt-app-metadata.js';

export type MaterializationProfile = GeneratedAppProfile | 'GENERIC_CUSTOM_APP_V1' | 'HABIT_TRACKER_WEB_V1';

export interface ProfileFeatureDefinition {
  readOnly: true;
  profile: MaterializationProfile;
  expectedAppType: string;
  featureModules: string[];
  routes: string[];
  requiredUiTerms: string[];
  forbiddenGenericTerms: string[];
}

const GENERIC_PM_FALLBACK = ['Project Management System', 'Welcome to Project Management'];

function def(
  profile: MaterializationProfile,
  expectedAppType: string,
  featureModules: string[],
  routes: string[],
  requiredUiTerms: string[],
): ProfileFeatureDefinition {
  return {
    readOnly: true,
    profile,
    expectedAppType,
    featureModules,
    routes,
    requiredUiTerms,
    forbiddenGenericTerms: GENERIC_PM_FALLBACK,
  };
}

const PROFILE_FEATURE_MAP: Record<MaterializationProfile, ProfileFeatureDefinition> = {
  EXPENSE_TRACKER_WEB_V1: def(
    'EXPENSE_TRACKER_WEB_V1',
    'expense-tracker',
    ['auth', 'dashboard', 'income', 'expenses', 'categories', 'reports', 'charts', 'csv-export', 'persistence'],
    ['/', '/dashboard', '/income', '/expenses', '/categories', '/reports', '/charts', '/export'],
    ['expense', 'income', 'balance', 'categories', 'reports', 'chart', 'csv'],
  ),
  FINANCE_TRACKER_WEB_V1: def(
    'FINANCE_TRACKER_WEB_V1',
    'finance-tracker',
    ['auth', 'dashboard', 'transactions', 'categories', 'reports', 'charts', 'csv-export', 'persistence'],
    ['/', '/dashboard', '/transactions', '/categories', '/reports', '/charts', '/export'],
    ['finance', 'transaction', 'balance', 'categories', 'reports', 'chart', 'csv'],
  ),
  CRM_WEB_V1: def(
    'CRM_WEB_V1',
    'crm',
    ['auth', 'dashboard', 'customers', 'leads', 'pipeline', 'deals', 'contacts', 'follow-ups', 'reports', 'persistence'],
    ['/', '/dashboard', '/customers', '/leads', '/pipeline', '/deals', '/contacts', '/follow-ups', '/reports'],
    ['customer', 'lead', 'pipeline', 'deal', 'contact', 'follow-up'],
  ),
  TASK_TRACKER_WEB_V1: def(
    'TASK_TRACKER_WEB_V1',
    'task-tracker',
    ['auth', 'dashboard', 'tasks', 'projects', 'labels', 'calendar', 'reports', 'settings', 'persistence'],
    ['/', '/dashboard', '/tasks', '/projects', '/labels', '/calendar', '/reports', '/settings'],
    ['task', 'project', 'due', 'complete', 'label', 'calendar'],
  ),
  QR_APP: def(
    'QR_APP',
    'qr-app',
    ['auth', 'dashboard', 'generator', 'scanner', 'code-history', 'analytics', 'settings', 'persistence'],
    ['/', '/dashboard', '/generator', '/scanner', '/code-history', '/analytics', '/settings'],
    ['qr', 'generate', 'scan', 'code', 'history', 'analytics'],
  ),
  INVENTORY_WEB_V1: def(
    'INVENTORY_WEB_V1',
    'inventory',
    ['auth', 'dashboard', 'products', 'stock', 'suppliers', 'reorder', 'reports', 'persistence'],
    ['/', '/dashboard', '/products', '/stock', '/suppliers', '/reorder', '/reports'],
    ['inventory', 'stock', 'product', 'supplier', 'reorder'],
  ),
  BOOKING_WEB_V1: def(
    'BOOKING_WEB_V1',
    'booking',
    ['auth', 'dashboard', 'appointments', 'calendar', 'customers', 'availability', 'reports'],
    ['/', '/dashboard', '/appointments', '/calendar', '/customers', '/availability', '/reports'],
    ['booking', 'appointment', 'schedule', 'calendar', 'availability'],
  ),
  PROJECT_MANAGEMENT_WEB_V1: def(
    'PROJECT_MANAGEMENT_WEB_V1',
    'project-management',
    ['auth', 'dashboard', 'projects', 'tasks', 'team', 'timeline', 'reports'],
    ['/', '/dashboard', '/projects', '/tasks', '/team', '/timeline', '/reports'],
    ['project', 'task', 'timeline', 'team'],
  ),
  SCHOOL_MANAGEMENT_WEB_V1: def(
    'SCHOOL_MANAGEMENT_WEB_V1',
    'school-management',
    ['auth', 'dashboard', 'students', 'teachers', 'classes', 'attendance', 'reports'],
    ['/', '/dashboard', '/students', '/teachers', '/classes', '/attendance', '/reports'],
    ['student', 'teacher', 'class', 'attendance'],
  ),
  HABIT_TRACKER_WEB_V1: def(
    'HABIT_TRACKER_WEB_V1',
    'habit-tracker',
    ['auth', 'dashboard', 'habits', 'streaks', 'routines', 'goals', 'analytics', 'persistence'],
    ['/', '/dashboard', '/habits', '/streaks', '/routines', '/goals', '/analytics'],
    ['habit', 'streak', 'routine', 'goal', 'analytics'],
  ),
  GENERIC_CUSTOM_APP_V1: def(
    'GENERIC_CUSTOM_APP_V1',
    'custom-app',
    ['auth', 'dashboard', 'records', 'settings'],
    ['/', '/dashboard', '/records', '/settings'],
    ['dashboard'],
  ),
};

export function resolveMaterializationProfile(
  profile: GeneratedAppProfile | null,
  rawPrompt: string,
): MaterializationProfile {
  if (profile && profile in PROFILE_FEATURE_MAP) {
    return profile;
  }
  const lower = rawPrompt.toLowerCase();
  if (/habit|streak|routine/.test(lower)) return 'HABIT_TRACKER_WEB_V1';
  if (/booking|appointment|schedule/.test(lower)) return 'BOOKING_WEB_V1';
  return 'GENERIC_CUSTOM_APP_V1';
}

export function getProfileFeatureDefinition(
  profile: MaterializationProfile,
  rawPrompt: string,
): ProfileFeatureDefinition {
  const base = PROFILE_FEATURE_MAP[profile];
  if (profile !== 'GENERIC_CUSTOM_APP_V1' && profile !== 'HABIT_TRACKER_WEB_V1') {
    return base;
  }
  const modules =
    profile === 'HABIT_TRACKER_WEB_V1'
      ? PROFILE_FEATURE_MAP.HABIT_TRACKER_WEB_V1.featureModules
      : deriveGenericCustomFeatureModules(rawPrompt);
  const terms = derivePromptFeatureTerms(rawPrompt);
  const moduleTerms = modules.filter((moduleId) => !['auth', 'persistence'].includes(moduleId));
  const requiredUiTerms =
    terms.length >= 2
      ? terms
      : profile === 'HABIT_TRACKER_WEB_V1'
        ? ['habit', 'streak', 'daily', 'routine']
        : moduleTerms.length >= 2
          ? moduleTerms
          : ['dashboard', 'records', 'settings'];
  return {
    ...base,
    featureModules: modules,
    routes: modules.map((m) => `/${m}`),
    requiredUiTerms,
  };
}

export function listMaterializationProfiles(): MaterializationProfile[] {
  return Object.keys(PROFILE_FEATURE_MAP) as MaterializationProfile[];
}
