/**
 * General-Purpose Code Generation V1 — generation strategy router.
 */

import { PRODUCT_PATTERN_REGISTRY } from '../product-architect-intelligence-v1/product-pattern-registry.js';
import type { ProductArchitectDomain } from '../product-architect-intelligence-v1/product-architect-intelligence-types.js';
import type {
  GenerationStrategy,
  GenerationStrategyDefinition,
} from './general-purpose-code-generation-v1-types.js';

const STRATEGY_DEFINITIONS: Record<GenerationStrategy, Omit<GenerationStrategyDefinition, 'strategy'>> = {
  CRUD_APP: {
    readOnly: true,
    label: 'CRUD Application',
    requiredEntities: ['Primary Entity'],
    expectedWorkflows: ['Create', 'Read', 'Update', 'Delete', 'Search'],
    userRoles: ['User', 'Admin'],
    screenExpectations: ['List', 'Create', 'Edit', 'Detail'],
    dataModelComplexity: 'LOW',
    validationNeeds: ['Entity CRUD', 'Search', 'Persistence'],
  },
  WORKFLOW_APP: {
    readOnly: true,
    label: 'Workflow Application',
    requiredEntities: ['Primary Record', 'Status'],
    expectedWorkflows: ['Create', 'Assign', 'Update Status', 'Complete', 'History'],
    userRoles: ['Agent', 'Manager', 'Admin'],
    screenExpectations: ['Dashboard', 'List', 'Detail', 'Workflow Step', 'Activity'],
    dataModelComplexity: 'MEDIUM',
    validationNeeds: ['State transitions', 'Role actions', 'Workflow completion'],
  },
  MARKETPLACE_APP: {
    readOnly: true,
    label: 'Marketplace Application',
    requiredEntities: ['Listing', 'Order', 'User'],
    expectedWorkflows: ['Create Listing', 'Browse', 'View Detail', 'Contact Seller', 'Manage Orders'],
    userRoles: ['Buyer', 'Seller', 'Admin'],
    screenExpectations: ['Listings', 'Product Detail', 'Search', 'Orders', 'Profile'],
    dataModelComplexity: 'HIGH',
    validationNeeds: ['Listing lifecycle', 'Purchase flow', 'Multi-role navigation'],
  },
  DASHBOARD_APP: {
    readOnly: true,
    label: 'Dashboard Application',
    requiredEntities: ['Metric', 'Transaction', 'Category'],
    expectedWorkflows: ['View Dashboard', 'Add Entry', 'Categorize', 'Report'],
    userRoles: ['Owner', 'Viewer', 'Admin'],
    screenExpectations: ['Dashboard', 'Reports', 'Settings', 'Activity'],
    dataModelComplexity: 'MEDIUM',
    validationNeeds: ['Metrics visibility', 'Reports', 'Filters'],
  },
  PORTAL_APP: {
    readOnly: true,
    label: 'Portal Application',
    requiredEntities: ['User', 'Record', 'Appointment'],
    expectedWorkflows: ['Register', 'Book', 'View Records', 'Manage Profile'],
    userRoles: ['Patient', 'Provider', 'Admin'],
    screenExpectations: ['Dashboard', 'Profile', 'Records', 'Settings', 'Notifications'],
    dataModelComplexity: 'HIGH',
    validationNeeds: ['Role portals', 'Secure views', 'Workflow steps'],
  },
  BOOKING_APP: {
    readOnly: true,
    label: 'Booking Application',
    requiredEntities: ['Slot', 'Booking', 'Customer'],
    expectedWorkflows: ['Search Availability', 'Select Slot', 'Enter Details', 'Confirm', 'Cancel'],
    userRoles: ['Customer', 'Provider', 'Admin'],
    screenExpectations: ['Calendar', 'Booking Form', 'Confirmation', 'My Bookings'],
    dataModelComplexity: 'MEDIUM',
    validationNeeds: ['Booking conflict warning', 'Availability', 'Confirmation flow'],
  },
  CONTENT_APP: {
    readOnly: true,
    label: 'Content Application',
    requiredEntities: ['Course', 'Lesson', 'Progress'],
    expectedWorkflows: ['Create Course', 'Enroll', 'Track Lessons', 'Mark Progress', 'Certificate'],
    userRoles: ['Teacher', 'Student', 'Admin'],
    screenExpectations: ['Catalog', 'Course Detail', 'Lesson', 'Progress', 'Admin'],
    dataModelComplexity: 'HIGH',
    validationNeeds: ['Progress tracker', 'Lesson flow', 'Enrollment'],
  },
  COMMUNITY_APP: {
    readOnly: true,
    label: 'Community Application',
    requiredEntities: ['Group', 'Post', 'Member'],
    expectedWorkflows: ['Join Group', 'Create Post', 'Comment', 'Message', 'Moderate'],
    userRoles: ['Member', 'Moderator', 'Admin'],
    screenExpectations: ['Feed', 'Groups', 'Profile', 'Messages', 'Notifications'],
    dataModelComplexity: 'HIGH',
    validationNeeds: ['Social workflows', 'Role moderation', 'Activity feed'],
  },
  AI_ASSISTED_APP: {
    readOnly: true,
    label: 'AI-Assisted Application',
    requiredEntities: ['Prompt', 'Session', 'Output'],
    expectedWorkflows: ['Start Session', 'Submit Prompt', 'Review Output', 'Save Result'],
    userRoles: ['User', 'Admin'],
    screenExpectations: ['Chat', 'History', 'Settings'],
    dataModelComplexity: 'MEDIUM',
    validationNeeds: ['AI feature placeholders', 'Session flow'],
  },
  CUSTOM_APP: {
    readOnly: true,
    label: 'Custom Application',
    requiredEntities: ['Primary Entity'],
    expectedWorkflows: ['Primary Flow'],
    userRoles: ['User', 'Admin'],
    screenExpectations: ['Dashboard', 'List', 'Detail'],
    dataModelComplexity: 'MEDIUM',
    validationNeeds: ['Core actions', 'Navigation'],
  },
};

function detectDomain(prompt: string): ProductArchitectDomain {
  const lower = prompt.toLowerCase();
  for (const pattern of PRODUCT_PATTERN_REGISTRY) {
    if (pattern.detectionPatterns.some((re) => re.test(lower))) {
      return pattern.domain;
    }
  }
  return 'GENERIC';
}

export function routeGenerationStrategy(input: {
  prompt: string;
  domain?: string;
  strategyHint?: GenerationStrategy;
}): { strategy: GenerationStrategy; domain: ProductArchitectDomain; definition: GenerationStrategyDefinition } {
  const domain = (input.domain as ProductArchitectDomain | undefined) ?? detectDomain(input.prompt);
  const lower = input.prompt.toLowerCase();

  let strategy: GenerationStrategy = input.strategyHint ?? 'CUSTOM_APP';

  if (input.strategyHint) {
    strategy = input.strategyHint;
  } else if (/\b(marketplace|seller|buyer|listing)\b/i.test(lower)) {
    strategy = 'MARKETPLACE_APP';
  } else if (/\b(booking|appointment|calendar|schedule|reservation)\b/i.test(lower)) {
    strategy = 'BOOKING_APP';
  } else if (/\b(learning|course|lesson|student|teacher|certificate)\b/i.test(lower)) {
    strategy = 'CONTENT_APP';
  } else if (/\b(community|social|group|post|message|member)\b/i.test(lower)) {
    strategy = 'COMMUNITY_APP';
  } else if (/\b(ticket|support|agent|sla|helpdesk)\b/i.test(lower)) {
    strategy = 'WORKFLOW_APP';
  } else if (/\b(event|registration|ticketing|attendee)\b/i.test(lower)) {
    strategy = 'WORKFLOW_APP';
  } else if (/\b(healthcare|patient|medical|provider|portal)\b/i.test(lower)) {
    strategy = 'PORTAL_APP';
  } else if (/\b(finance|budget|transaction|expense|spending)\b/i.test(lower)) {
    strategy = 'DASHBOARD_APP';
  } else if (/\b(job board|employer|candidate|apply|resume)\b/i.test(lower)) {
    strategy = 'WORKFLOW_APP';
  } else if (/\b(property|tenant|lease|maintenance|landlord)\b/i.test(lower)) {
    strategy = 'WORKFLOW_APP';
  } else if (/\b(crm|inventory|task tracker|school|project management)\b/i.test(lower)) {
    strategy = 'CRUD_APP';
  } else if (/\b(ai|assistant|copilot|chatbot)\b/i.test(lower)) {
    strategy = 'AI_ASSISTED_APP';
  }

  const base = STRATEGY_DEFINITIONS[strategy];
  return {
    strategy,
    domain,
    definition: { ...base, strategy },
  };
}

export function getGenerationStrategyDefinition(
  strategy: GenerationStrategy,
): GenerationStrategyDefinition {
  return { ...STRATEGY_DEFINITIONS[strategy], strategy };
}

export { STRATEGY_DEFINITIONS as GENERATION_STRATEGY_DEFINITIONS };
