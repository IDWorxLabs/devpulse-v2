/**
 * Product Architect Intelligence V1 — suite registry (12 core product domains).
 */

export const PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS = [
  {
    profile: 'CRM_WEB_V1',
    domain: 'CRM',
    prompt: 'Build a CRM to manage customers with create, edit, delete, and search customer records.',
    productName: 'CRM',
  },
  {
    profile: 'MARKETPLACE_WEB_V1',
    domain: 'MARKETPLACE',
    prompt: 'Build a marketplace for buyers and sellers with listings, search, and transactions.',
    productName: 'Marketplace',
  },
  {
    profile: 'INVENTORY_WEB_V1',
    domain: 'INVENTORY',
    prompt: 'Build an inventory system to add items, edit items, remove items, and search inventory.',
    productName: 'Inventory',
  },
  {
    profile: 'SCHOOL_MANAGEMENT_WEB_V1',
    domain: 'SCHOOL_MANAGEMENT',
    prompt:
      'Build a school management system for students, teachers, and classes with create, edit, delete, and assign workflows.',
    productName: 'School Management',
  },
  {
    profile: 'HEALTHCARE_PORTAL_WEB_V1',
    domain: 'HEALTHCARE',
    prompt: 'Build a healthcare portal for patients, appointments, providers, and medical records.',
    productName: 'Healthcare Portal',
  },
  {
    profile: 'FINANCE_TRACKER_WEB_V1',
    domain: 'FINANCE',
    prompt: 'Build a finance tracker for budgets, expenses, transactions, and reports.',
    productName: 'Finance Tracker',
  },
  {
    profile: 'BOOKING_PLATFORM_WEB_V1',
    domain: 'BOOKING',
    prompt: 'Build a booking platform with calendar scheduling, reservations, and availability management.',
    productName: 'Booking Platform',
  },
  {
    profile: 'RESTAURANT_POS_WEB_V1',
    domain: 'RESTAURANT_POS',
    prompt: 'Build a restaurant POS with orders, menu management, table service, and payment processing.',
    productName: 'Restaurant POS',
  },
  {
    profile: 'PROJECT_MANAGEMENT_WEB_V1',
    domain: 'PROJECT_MANAGEMENT',
    prompt:
      'Build a project management system to create projects, edit them, delete them, search projects, and assign team members.',
    productName: 'Project Management',
  },
  {
    profile: 'HR_PLATFORM_WEB_V1',
    domain: 'HR',
    prompt: 'Build an HR platform for employees, recruiting, payroll, and time off.',
    productName: 'HR Platform',
  },
  {
    profile: 'SOCIAL_PLATFORM_WEB_V1',
    domain: 'COMMUNITY_PLATFORM',
    prompt: 'Build a community platform with groups, posts, messaging, and member profiles.',
    productName: 'Social Platform',
  },
  {
    profile: 'LEARNING_PLATFORM_WEB_V1',
    domain: 'LEARNING_PLATFORM',
    prompt: 'Build a learning platform with courses, lessons, student progress, and assessments.',
    productName: 'Learning Platform',
  },
] as const;

export function resolveProductArchitectIntelligenceSuiteApp(input?: {
  profile?: string;
  productPrompt?: string;
  productName?: string;
}): {
  profile: string;
  domain: string;
  prompt: string;
  productName: string;
} {
  if (input?.profile) {
    const match = PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS.find(
      (app) => app.profile === input.profile,
    );
    if (match) {
      return {
        profile: match.profile,
        domain: match.domain,
        prompt: input.productPrompt ?? match.prompt,
        productName: input.productName ?? match.productName,
      };
    }
  }

  const fallback = PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS[0];
  return {
    profile: input?.profile ?? fallback.profile,
    domain: fallback.domain,
    prompt: input?.productPrompt ?? fallback.prompt,
    productName: input?.productName ?? fallback.productName,
  };
}
