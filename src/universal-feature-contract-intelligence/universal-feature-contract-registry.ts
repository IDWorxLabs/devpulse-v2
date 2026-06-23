/**
 * Universal Feature Contract Intelligence V1 — registry constants.
 */

export const UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE_V1_PASS_TOKEN =
  'UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE_V1_PASS';

export const UNIVERSAL_FEATURE_CONTRACT_OWNER_MODULE =
  'aidevengine_universal_feature_contract_intelligence';

export const UNIVERSAL_FEATURE_CONTRACT_PHASE = 27.4;

export const UNIVERSAL_FEATURE_REALITY_MIN_LAUNCH_SCORE = 80;

export const UNIVERSAL_FEATURE_CONTRACT_SUITE_APPS: readonly {
  profile: import('./universal-feature-contract-types.js').UniversalAppProfile;
  prompt: string;
}[] = [
  {
    profile: 'TASK_TRACKER_WEB_V1',
    prompt:
      'Build a task tracker where I can add tasks, edit them, mark them complete, delete them, and filter by active or completed.',
  },
  {
    profile: 'CRM_WEB_V1',
    prompt:
      'Build a CRM to manage customers with create, edit, delete, and search customer records.',
  },
  {
    profile: 'INVENTORY_WEB_V1',
    prompt:
      'Build an inventory system to add items, edit items, remove items, and search inventory.',
  },
  {
    profile: 'SCHOOL_MANAGEMENT_WEB_V1',
    prompt:
      'Build a school management system for students, teachers, and classes with create, edit, delete, and assign workflows.',
  },
  {
    profile: 'PROJECT_MANAGEMENT_WEB_V1',
    prompt:
      'Build a project management system to create projects, edit them, delete them, search projects, and assign team members.',
  },
];
