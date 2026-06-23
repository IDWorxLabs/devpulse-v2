/**
 * Engineering Reality Authority V1 — registry constants.
 */

export const ENGINEERING_REALITY_V1_PASS_TOKEN = 'ENGINEERING_REALITY_V1_PASS';

export const ENGINEERING_REALITY_OWNER_MODULE = 'aidevengine_engineering_reality_authority';

export const ENGINEERING_REALITY_PHASE = 27.5;

export const ENGINEERING_REALITY_MIN_LAUNCH_SCORE = 80;

export const ENGINEERING_SUITE_APPS: readonly {
  profile: string;
  prompt: string;
  productName: string;
  navLabel: string;
}[] = [
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
];

export const SECRET_PATTERNS: readonly RegExp[] = [
  /sk-[a-zA-Z0-9]{10,}/,
  /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{8,}/i,
  /password\s*[:=]\s*['"][^'"]{4,}/i,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
];
