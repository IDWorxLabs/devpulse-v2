/**
 * AFLA Trust Calibration V1 — Founder Trust Calibration Suite (20+ categories).
 */

export const FOUNDER_TRUST_CALIBRATION_SUITE_APPS = [
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
    profile: 'PROJECT_MANAGEMENT_WEB_V1',
    domain: 'PROJECT_MANAGEMENT',
    prompt:
      'Build a project management system to create projects, edit them, delete them, search projects, and assign team members.',
    productName: 'Project Management',
  },
  {
    profile: 'BOOKING_PLATFORM_WEB_V1',
    domain: 'BOOKING_PLATFORM',
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
    profile: 'LEARNING_PLATFORM_WEB_V1',
    domain: 'LEARNING_PLATFORM',
    prompt: 'Build a learning platform with courses, lessons, student progress, and assessments.',
    productName: 'Learning Platform',
  },
  {
    profile: 'INSURANCE_CRM_WEB_V1',
    domain: 'INSURANCE_CRM',
    prompt: 'Build an insurance CRM for policies, claims, agents, and customer lifecycle management.',
    productName: 'Insurance CRM',
  },
  {
    profile: 'FLEET_MANAGEMENT_WEB_V1',
    domain: 'FLEET_MANAGEMENT',
    prompt: 'Build a fleet management system for vehicles, drivers, routes, and maintenance tracking.',
    productName: 'Fleet Management',
  },
  {
    profile: 'HR_PLATFORM_WEB_V1',
    domain: 'HR_PLATFORM',
    prompt: 'Build an HR platform with employee records, onboarding, time tracking, and payroll workflows.',
    productName: 'HR Platform',
  },
  {
    profile: 'CUSTOMER_SUPPORT_WEB_V1',
    domain: 'CUSTOMER_SUPPORT',
    prompt: 'Build a customer support platform with tickets, agent queues, knowledge base, and SLA tracking.',
    productName: 'Customer Support Platform',
  },
  {
    profile: 'SOCIAL_PLATFORM_WEB_V1',
    domain: 'SOCIAL_PLATFORM',
    prompt: 'Build a social platform with profiles, posts, comments, likes, and friend connections.',
    productName: 'Social Platform',
  },
  {
    profile: 'FITNESS_APP_WEB_V1',
    domain: 'FITNESS_APP',
    prompt: 'Build a fitness app with workouts, exercise tracking, progress charts, and goal setting.',
    productName: 'Fitness App',
  },
  {
    profile: 'HEALTHCARE_PORTAL_WEB_V1',
    domain: 'HEALTHCARE_PORTAL',
    prompt: 'Build a healthcare portal for patients, appointments, medical records, and provider messaging.',
    productName: 'Healthcare Portal',
  },
  {
    profile: 'PROPERTY_MANAGEMENT_WEB_V1',
    domain: 'PROPERTY_MANAGEMENT',
    prompt: 'Build a property management system for listings, tenants, leases, and maintenance requests.',
    productName: 'Property Management',
  },
  {
    profile: 'E_COMMERCE_PLATFORM_WEB_V1',
    domain: 'E_COMMERCE_PLATFORM',
    prompt: 'Build an e-commerce platform with product catalog, cart, checkout, and order management.',
    productName: 'E-Commerce Platform',
  },
  {
    profile: 'JOB_BOARD_WEB_V1',
    domain: 'JOB_BOARD',
    prompt: 'Build a job board with job listings, employer profiles, applications, and candidate search.',
    productName: 'Job Board',
  },
  {
    profile: 'EVENT_PLATFORM_WEB_V1',
    domain: 'EVENT_PLATFORM',
    prompt: 'Build an event platform with event creation, ticketing, schedules, and attendee management.',
    productName: 'Event Platform',
  },
  {
    profile: 'FINANCE_TRACKER_WEB_V1',
    domain: 'FINANCE_TRACKER',
    prompt: 'Build a finance tracker with budgets, transactions, categories, and spending reports.',
    productName: 'Finance Tracker',
  },
] as const;

export type FounderTrustCalibrationProfile = (typeof FOUNDER_TRUST_CALIBRATION_SUITE_APPS)[number]['profile'];

export function resolveTrustCalibrationSuiteApp(
  profile?: string | null,
): (typeof FOUNDER_TRUST_CALIBRATION_SUITE_APPS)[number] {
  const match = FOUNDER_TRUST_CALIBRATION_SUITE_APPS.find((app) => app.profile === profile);
  return match ?? FOUNDER_TRUST_CALIBRATION_SUITE_APPS[0];
}
