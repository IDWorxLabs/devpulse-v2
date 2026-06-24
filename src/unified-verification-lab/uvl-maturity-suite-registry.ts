/**
 * UVL Maturity V1 — multi-app verification proof registry.
 */

export const UVL_VERIFICATION_SUITE_APPS = [
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
] as const;

export type UvlVerificationSuiteProfile = (typeof UVL_VERIFICATION_SUITE_APPS)[number]['profile'];

export function resolveUvlSuiteApp(profile?: string | null): (typeof UVL_VERIFICATION_SUITE_APPS)[number] {
  const match = UVL_VERIFICATION_SUITE_APPS.find((app) => app.profile === profile);
  return match ?? UVL_VERIFICATION_SUITE_APPS[0];
}
