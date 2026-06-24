/**
 * General-Purpose Code Generation V1 — 10 non-trivial app proof suite.
 */

import type { GenerationStrategy } from './general-purpose-code-generation-v1-types.js';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';

export interface GeneralPurposeProofSuiteEntry {
  readOnly: true;
  profile: string;
  domain: string;
  productName: string;
  prompt: string;
  strategy: GenerationStrategy;
  codegenProfile: GeneratedAppProfile;
}

export const GENERAL_PURPOSE_PROOF_SUITE: readonly GeneralPurposeProofSuiteEntry[] = [
  {
    readOnly: true,
    profile: 'MARKETPLACE_WEB_V1',
    domain: 'MARKETPLACE',
    productName: 'Marketplace',
    prompt: 'Build a marketplace for buyers and sellers with listings, search, and transactions.',
    strategy: 'MARKETPLACE_APP',
    codegenProfile: 'CRM_WEB_V1',
  },
  {
    readOnly: true,
    profile: 'APPOINTMENT_BOOKING_WEB_V1',
    domain: 'BOOKING',
    productName: 'Booking Platform',
    prompt: 'Build an appointment booking system for clinics with calendar and reminders.',
    strategy: 'BOOKING_APP',
    codegenProfile: 'CRM_WEB_V1',
  },
  {
    readOnly: true,
    profile: 'LEARNING_PLATFORM_WEB_V1',
    domain: 'LEARNING_PLATFORM',
    productName: 'Learning Platform',
    prompt: 'Build a learning platform with courses, lessons, student progress, and assessments.',
    strategy: 'CONTENT_APP',
    codegenProfile: 'SCHOOL_MANAGEMENT_WEB_V1',
  },
  {
    readOnly: true,
    profile: 'CUSTOMER_SUPPORT_WEB_V1',
    domain: 'CUSTOMER_SUPPORT',
    productName: 'Customer Support Platform',
    prompt: 'Build a customer support platform with tickets, agent queues, knowledge base, and SLA tracking.',
    strategy: 'WORKFLOW_APP',
    codegenProfile: 'CRM_WEB_V1',
  },
  {
    readOnly: true,
    profile: 'EVENT_PLATFORM_WEB_V1',
    domain: 'EVENT',
    productName: 'Event Platform',
    prompt: 'Build an event platform with event listings, registration, ticketing, and attendee management.',
    strategy: 'WORKFLOW_APP',
    codegenProfile: 'PROJECT_MANAGEMENT_WEB_V1',
  },
  {
    readOnly: true,
    profile: 'HEALTHCARE_PORTAL_WEB_V1',
    domain: 'HEALTHCARE',
    productName: 'Healthcare Portal',
    prompt: 'Build a healthcare portal for patients, appointments, providers, and medical records.',
    strategy: 'PORTAL_APP',
    codegenProfile: 'CRM_WEB_V1',
  },
  {
    readOnly: true,
    profile: 'FINANCE_TRACKER_WEB_V1',
    domain: 'FINANCE',
    productName: 'Finance Tracker',
    prompt: 'Build a finance tracker with budgets, transactions, categories, and spending reports.',
    strategy: 'DASHBOARD_APP',
    codegenProfile: 'PROJECT_MANAGEMENT_WEB_V1',
  },
  {
    readOnly: true,
    profile: 'JOB_BOARD_WEB_V1',
    domain: 'JOB_BOARD',
    productName: 'Job Board',
    prompt: 'Build a job board where employers post jobs and candidates search, apply, and track applications.',
    strategy: 'WORKFLOW_APP',
    codegenProfile: 'CRM_WEB_V1',
  },
  {
    readOnly: true,
    profile: 'PROPERTY_MANAGEMENT_WEB_V1',
    domain: 'PROPERTY',
    productName: 'Property Management',
    prompt: 'Build a property management system for listings, tenants, leases, and maintenance requests.',
    strategy: 'WORKFLOW_APP',
    codegenProfile: 'INVENTORY_WEB_V1',
  },
  {
    readOnly: true,
    profile: 'SOCIAL_PLATFORM_WEB_V1',
    domain: 'COMMUNITY_PLATFORM',
    productName: 'Community Platform',
    prompt: 'Build a community platform with groups, posts, messaging, and member profiles.',
    strategy: 'COMMUNITY_APP',
    codegenProfile: 'CRM_WEB_V1',
  },
] as const;

export function resolveGeneralPurposeProofEntry(profile?: string): GeneralPurposeProofSuiteEntry {
  if (profile) {
    const match = GENERAL_PURPOSE_PROOF_SUITE.find((e) => e.profile === profile);
    if (match) return match;
  }
  return GENERAL_PURPOSE_PROOF_SUITE[0]!;
}
