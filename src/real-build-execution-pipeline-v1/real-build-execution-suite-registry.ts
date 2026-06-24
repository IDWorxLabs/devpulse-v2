/**
 * Real Build Execution Pipeline V1 — 15-category execution suite.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { RealBuildSuiteEntry } from './real-build-execution-pipeline-types.js';

function entry(
  profile: string,
  domain: string,
  productName: string,
  prompt: string,
  codegenProfile: GeneratedAppProfile,
): RealBuildSuiteEntry {
  return { profile, domain, productName, prompt, codegenProfile };
}

export const REAL_BUILD_EXECUTION_SUITE: readonly RealBuildSuiteEntry[] = [
  entry(
    'TASK_TRACKER_WEB_V1',
    'TASK_TRACKER',
    'Task Tracker',
    'Build a task tracker where users can add tasks, mark them complete, delete tasks, and filter by all, active, and completed.',
    'TASK_TRACKER_WEB_V1',
  ),
  entry(
    'CRM_WEB_V1',
    'CRM',
    'CRM',
    'Build a CRM to manage customers with create, edit, delete, and search customer records.',
    'CRM_WEB_V1',
  ),
  entry(
    'INVENTORY_WEB_V1',
    'INVENTORY',
    'Inventory',
    'Build an inventory system to add items, edit items, remove items, and search inventory.',
    'INVENTORY_WEB_V1',
  ),
  entry(
    'SCHOOL_MANAGEMENT_WEB_V1',
    'SCHOOL_MANAGEMENT',
    'School Management',
    'Build a school management system for students, teachers, and classes with create, edit, delete, and assign workflows.',
    'SCHOOL_MANAGEMENT_WEB_V1',
  ),
  entry(
    'PROJECT_MANAGEMENT_WEB_V1',
    'PROJECT_MANAGEMENT',
    'Project Management',
    'Build a project management system to create projects, edit them, delete them, search projects, and assign team members.',
    'PROJECT_MANAGEMENT_WEB_V1',
  ),
  entry(
    'MARKETPLACE_WEB_V1',
    'MARKETPLACE',
    'Marketplace',
    'Build a marketplace for buyers and sellers with listings, search, and transactions.',
    'CRM_WEB_V1',
  ),
  entry(
    'APPOINTMENT_BOOKING_WEB_V1',
    'BOOKING',
    'Booking Platform',
    'Build an appointment booking system for clinics with calendar and reminders.',
    'CRM_WEB_V1',
  ),
  entry(
    'RESTAURANT_POS_WEB_V1',
    'RESTAURANT_POS',
    'Restaurant POS',
    'Build a restaurant POS with orders, menu management, table service, and payment processing.',
    'INVENTORY_WEB_V1',
  ),
  entry(
    'LEARNING_PLATFORM_WEB_V1',
    'LEARNING',
    'Learning Platform',
    'Build a learning platform with courses, lessons, student progress, and assessments.',
    'SCHOOL_MANAGEMENT_WEB_V1',
  ),
  entry(
    'HR_PLATFORM_WEB_V1',
    'HR',
    'HR Platform',
    'Build an HR platform with employee records, onboarding, time tracking, and payroll workflows.',
    'CRM_WEB_V1',
  ),
  entry(
    'CUSTOMER_SUPPORT_WEB_V1',
    'CUSTOMER_SUPPORT',
    'Customer Support Platform',
    'Build a customer support platform with tickets, agent queues, knowledge base, and SLA tracking.',
    'CRM_WEB_V1',
  ),
  entry(
    'INSURANCE_CRM_WEB_V1',
    'INSURANCE_CRM',
    'Insurance CRM',
    'Build an insurance CRM for policies, claims, agents, and customer lifecycle management.',
    'CRM_WEB_V1',
  ),
  entry(
    'FLEET_MANAGEMENT_WEB_V1',
    'FLEET',
    'Fleet Management',
    'Build a fleet management system for vehicles, drivers, routes, and maintenance tracking.',
    'INVENTORY_WEB_V1',
  ),
  entry(
    'FINANCE_TRACKER_WEB_V1',
    'FINANCE',
    'Finance Tracker',
    'Build a finance tracker with budgets, transactions, categories, and spending reports.',
    'PROJECT_MANAGEMENT_WEB_V1',
  ),
  entry(
    'E_COMMERCE_PLATFORM_WEB_V1',
    'E_COMMERCE',
    'E-Commerce Platform',
    'Build an e-commerce platform with product catalog, cart, checkout, and order management.',
    'INVENTORY_WEB_V1',
  ),
] as const;

export function resolveRealBuildSuiteEntry(profile?: string | null): RealBuildSuiteEntry {
  if (profile) {
    const match = REAL_BUILD_EXECUTION_SUITE.find((entry) => entry.profile === profile);
    if (match) return match;
  }
  return REAL_BUILD_EXECUTION_SUITE[0]!;
}

export function listRealBuildSuiteProfiles(): readonly string[] {
  return REAL_BUILD_EXECUTION_SUITE.map((entry) => entry.profile);
}
