/**
 * Autonomous Founder Launch Authority V1 — registry constants.
 */

export const AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS_TOKEN =
  'AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS' as const;

export const AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_OWNER_MODULE =
  'aidevengine_autonomous_founder_launch_authority' as const;

export const AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_PHASE = 27.6;

export const DEFAULT_AUTOFIX_MAX_RETRIES = 2;

export const FOUNDER_LAUNCH_MIN_SCORE = 80;

export const FOUNDER_LAUNCH_USER_LABELS = {
  BUILDING: 'Building...',
  TESTING: 'Testing...',
  FIXING_ISSUES: 'Fixing Issues...',
  FINAL_LAUNCH_REVIEW: 'Final Launch Review...',
  LAUNCH_READY: '✓ Launch Ready',
  LAUNCH_NOT_READY: '✗ Launch Not Ready',
} as const;

export const FOUNDER_LAUNCH_SUITE_APPS = [
  {
    profile: 'TASK_TRACKER_WEB_V1',
    prompt:
      'Build a task tracker where I can add tasks, edit them, mark them complete, delete them, and filter by active or completed.',
    productName: 'Task Tracker',
    navLabel: 'Tasks',
  },
  {
    profile: 'CRM_WEB_V1',
    prompt:
      'Build a CRM to manage customers with create, edit, delete, and search customer records.',
    productName: 'CRM',
    navLabel: 'Customers',
  },
  {
    profile: 'INVENTORY_WEB_V1',
    prompt:
      'Build an inventory system to add items, edit items, remove items, and search inventory.',
    productName: 'Inventory System',
    navLabel: 'Inventory',
  },
  {
    profile: 'SCHOOL_MANAGEMENT_WEB_V1',
    prompt:
      'Build a school management system for students, teachers, and classes with create, edit, delete, and assign workflows.',
    productName: 'School Management System',
    navLabel: 'Students',
  },
  {
    profile: 'PROJECT_MANAGEMENT_WEB_V1',
    prompt:
      'Build a project management system to create projects, edit them, delete them, search projects, and assign team members.',
    productName: 'Project Management System',
    navLabel: 'Projects',
  },
] as const;
