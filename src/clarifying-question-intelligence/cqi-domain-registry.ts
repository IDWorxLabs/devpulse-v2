/**
 * CQI Maturity V1 — product domain registry and domain-aware questions.
 */

import type { CqiAdaptiveQuestion, CqiProductDomain } from './cqi-maturity-types.js';

export interface CqiDomainDefinition {
  id: CqiProductDomain;
  label: string;
  detectionPatterns: readonly RegExp[];
  questions: readonly Omit<CqiAdaptiveQuestion, 'readOnly' | 'domain'>[];
}

export const CQI_DOMAIN_DEFINITIONS: readonly CqiDomainDefinition[] = [
  {
    id: 'CRM',
    label: 'CRM',
    detectionPatterns: [/\b(crm|customer relationship|lead management|sales pipeline|customers)\b/i],
    questions: [
      {
        question: 'How many user roles exist?',
        whyItMatters: 'CRM permissions depend on role count.',
        category: 'Roles',
        priority: 'CRITICAL',
      },
      {
        question: 'Need lead management?',
        whyItMatters: 'Lead workflows shape CRM structure.',
        category: 'Workflows',
        priority: 'CRITICAL',
      },
      {
        question: 'Need customer notes?',
        whyItMatters: 'Notes affect data model and UI.',
        category: 'Data',
        priority: 'IMPORTANT',
      },
      {
        question: 'Need email integration?',
        whyItMatters: 'Integrations drive architecture.',
        category: 'Integrations',
        priority: 'IMPORTANT',
      },
      {
        question: 'Need sales pipeline stages?',
        whyItMatters: 'Pipeline stages define core workflows.',
        category: 'Workflows',
        priority: 'CRITICAL',
      },
    ],
  },
  {
    id: 'MARKETPLACE',
    label: 'Marketplace',
    detectionPatterns: [/\b(marketplace|multi-vendor|buyers?|sellers?|vendors?)\b/i],
    questions: [
      {
        question: 'Are users buyers, sellers, or both?',
        whyItMatters: 'Marketplace roles determine onboarding and permissions.',
        category: 'Users',
        priority: 'CRITICAL',
      },
      {
        question: 'Need payments?',
        whyItMatters: 'Payments require monetization and compliance planning.',
        category: 'Monetization',
        priority: 'CRITICAL',
      },
      {
        question: 'Need messaging?',
        whyItMatters: 'Buyer-seller messaging affects workflow design.',
        category: 'Workflows',
        priority: 'IMPORTANT',
      },
      {
        question: 'Need reviews?',
        whyItMatters: 'Review systems affect trust and moderation.',
        category: 'Workflows',
        priority: 'IMPORTANT',
      },
      {
        question: 'Need shipping integration?',
        whyItMatters: 'Shipping integrations expand fulfillment scope.',
        category: 'Integrations',
        priority: 'IMPORTANT',
      },
    ],
  },
  {
    id: 'INVENTORY',
    label: 'Inventory System',
    detectionPatterns: [/\b(inventory|stock management|warehouse|barcode|supplier)\b/i],
    questions: [
      {
        question: 'Need barcode support?',
        whyItMatters: 'Barcode scanning changes mobile and hardware needs.',
        category: 'Workflows',
        priority: 'IMPORTANT',
      },
      {
        question: 'Need warehouse locations?',
        whyItMatters: 'Multi-location inventory affects data structure.',
        category: 'Data',
        priority: 'CRITICAL',
      },
      {
        question: 'Need supplier management?',
        whyItMatters: 'Supplier workflows expand scope beyond stock counts.',
        category: 'Workflows',
        priority: 'IMPORTANT',
      },
      {
        question: 'Need low-stock alerts?',
        whyItMatters: 'Alerts require notification design.',
        category: 'Notifications',
        priority: 'IMPORTANT',
      },
    ],
  },
  {
    id: 'SCHOOL_MANAGEMENT',
    label: 'School Management',
    detectionPatterns: [/\b(school management|students?|teachers?|parents?|attendance|grades?|timetables?)\b/i],
    questions: [
      {
        question: 'Students only?',
        whyItMatters: 'User scope defines the entire product model.',
        category: 'Users',
        priority: 'CRITICAL',
      },
      {
        question: 'Teachers?',
        whyItMatters: 'Teacher roles require separate permissions.',
        category: 'Roles',
        priority: 'CRITICAL',
      },
      {
        question: 'Parents?',
        whyItMatters: 'Parent access affects privacy and workflows.',
        category: 'Users',
        priority: 'IMPORTANT',
      },
      {
        question: 'Attendance tracking?',
        whyItMatters: 'Attendance is a core school workflow.',
        category: 'Workflows',
        priority: 'CRITICAL',
      },
      {
        question: 'Grades?',
        whyItMatters: 'Grading systems require structured data models.',
        category: 'Data',
        priority: 'IMPORTANT',
      },
      {
        question: 'Timetables?',
        whyItMatters: 'Scheduling affects complexity and UI.',
        category: 'Workflows',
        priority: 'IMPORTANT',
      },
    ],
  },
  {
    id: 'PROJECT_MANAGEMENT',
    label: 'Project Management',
    detectionPatterns: [/\b(project management|manage projects|milestones|team members|tasks and projects)\b/i],
    questions: [
      {
        question: 'Need team member assignment?',
        whyItMatters: 'Assignment workflows define collaboration scope.',
        category: 'Workflows',
        priority: 'CRITICAL',
      },
      {
        question: 'Need project milestones?',
        whyItMatters: 'Milestones affect planning structure.',
        category: 'Workflows',
        priority: 'IMPORTANT',
      },
      {
        question: 'Need role-based permissions?',
        whyItMatters: 'Permissions prevent unauthorized project changes.',
        category: 'Permissions',
        priority: 'CRITICAL',
      },
      {
        question: 'Need notifications for deadlines?',
        whyItMatters: 'Deadline alerts require notification channels.',
        category: 'Notifications',
        priority: 'IMPORTANT',
      },
    ],
  },
  {
    id: 'BOOKING_PLATFORM',
    label: 'Booking Platform',
    detectionPatterns: [/\b(booking platform|appointments?|reservations?|scheduling platform)\b/i],
    questions: [
      {
        question: 'Who can book — customers, staff, or both?',
        whyItMatters: 'Booking actors define authentication and flows.',
        category: 'Users',
        priority: 'CRITICAL',
      },
      {
        question: 'Need calendar integrations?',
        whyItMatters: 'Calendar sync affects integration scope.',
        category: 'Integrations',
        priority: 'IMPORTANT',
      },
      {
        question: 'Need payments at booking time?',
        whyItMatters: 'Payments change monetization and checkout flows.',
        category: 'Monetization',
        priority: 'IMPORTANT',
      },
      {
        question: 'Need reminder notifications?',
        whyItMatters: 'Reminders require notification design.',
        category: 'Notifications',
        priority: 'IMPORTANT',
      },
    ],
  },
  {
    id: 'RESTAURANT_POS',
    label: 'Restaurant POS',
    detectionPatterns: [/\b(restaurant pos|point of sale|kitchen display|menu management|restaurant system)\b/i],
    questions: [
      {
        question: 'Need table management?',
        whyItMatters: 'Table workflows differ from counter-only POS.',
        category: 'Workflows',
        priority: 'CRITICAL',
      },
      {
        question: 'Need kitchen order routing?',
        whyItMatters: 'Kitchen routing affects real-time workflow design.',
        category: 'Workflows',
        priority: 'CRITICAL',
      },
      {
        question: 'Need payment terminal integration?',
        whyItMatters: 'Payment hardware affects deployment targets.',
        category: 'Integrations',
        priority: 'IMPORTANT',
      },
      {
        question: 'Need inventory tied to menu items?',
        whyItMatters: 'Menu-inventory linkage expands data model.',
        category: 'Data',
        priority: 'IMPORTANT',
      },
    ],
  },
  {
    id: 'LEARNING_PLATFORM',
    label: 'Learning Platform',
    detectionPatterns: [/\b(learning platform|lms|online courses?|lessons?|education platform)\b/i],
    questions: [
      {
        question: 'Need instructor and student roles?',
        whyItMatters: 'Role separation is foundational for LMS products.',
        category: 'Roles',
        priority: 'CRITICAL',
      },
      {
        question: 'Need course progress tracking?',
        whyItMatters: 'Progress tracking defines core learner workflows.',
        category: 'Workflows',
        priority: 'CRITICAL',
      },
      {
        question: 'Need quizzes or assessments?',
        whyItMatters: 'Assessment features expand build scope.',
        category: 'Workflows',
        priority: 'IMPORTANT',
      },
      {
        question: 'Need certificates on completion?',
        whyItMatters: 'Certificates require document generation.',
        category: 'Files',
        priority: 'OPTIONAL',
      },
    ],
  },
] as const;

export function detectCqiProductDomain(text: string): CqiProductDomain {
  for (const domain of CQI_DOMAIN_DEFINITIONS) {
    if (domain.detectionPatterns.some((pattern) => pattern.test(text))) {
      return domain.id;
    }
  }
  return 'GENERIC';
}

export function getCqiDomainDefinition(domain: CqiProductDomain): CqiDomainDefinition | undefined {
  return CQI_DOMAIN_DEFINITIONS.find((entry) => entry.id === domain);
}
