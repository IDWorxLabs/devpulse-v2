/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1 — five product-domain proof scenarios.
 */

import { REAL_BUILD_EXECUTION_SUITE } from '../real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { DomainBehaviourSpec, MultiDomainScenarioDefinition } from './multi-domain-scenario-types.js';

function suiteEntry(profile: string): {
  suiteProfile: string;
  productName: string;
  codegenProfile: GeneratedAppProfile;
} {
  const entry = REAL_BUILD_EXECUTION_SUITE.find((item) => item.profile === profile);
  if (!entry) {
    throw new Error(`Missing REAL_BUILD_EXECUTION_SUITE entry for profile ${profile}`);
  }
  return {
    suiteProfile: entry.profile,
    productName: entry.productName,
    codegenProfile: entry.codegenProfile,
  };
}

function clarificationAnswers(domain: string, entity: string, workflows: string): readonly string[] {
  return [
    `Business: Browser-based ${domain} for small teams with a clean modern UI.`,
    `Users: Individual users and team members working in the browser.`,
    `Roles: Single end-user role; no separate admin portal for MVP.`,
    `Permissions: Users have full CRUD permissions on records they create.`,
    `Workflows: ${workflows}`,
    `Data: Primary ${entity} records stored in client state with explicit fields.`,
    'Files: No file upload or document storage required for MVP.',
    'Notifications: No email, SMS, or push notifications in MVP.',
    'Integrations: Standalone web app with no third-party integrations.',
    'AI: No AI or recommendation features.',
    'Monetization: Free productivity tool with no billing.',
    'Deployment: Static Vite React SPA for modern browsers; npm build produces dist/index.html.',
  ];
}

function behaviour(
  id: string,
  label: string,
  pattern: RegExp,
  critical = true,
  category = 'execution',
): DomainBehaviourSpec {
  return { id, label, pattern, critical, category };
}

const CRM_LITE_SUITE = suiteEntry('CRM_WEB_V1');
const BOOKING_SUITE = suiteEntry('APPOINTMENT_BOOKING_WEB_V1');
const INVENTORY_SUITE = suiteEntry('INVENTORY_WEB_V1');
const CLIENT_PORTAL_SUITE = suiteEntry('CUSTOMER_SUPPORT_WEB_V1');
const FIELD_SERVICE_SUITE = suiteEntry('FLEET_MANAGEMENT_WEB_V1');

export const MULTI_DOMAIN_PROOF_SCENARIOS: readonly MultiDomainScenarioDefinition[] = [
  {
    id: 'crm-lite',
    productDomain: 'CRM Lite',
    productRequest:
      'Build a simple CRM for small teams where users can add contacts, search contacts, add notes to a contact, mark follow-up status, and view a count of open follow-ups. It should have a clean browser UI.',
    clarificationAnswers: clarificationAnswers(
      'CRM for contacts and follow-ups',
      'Contact/Customer',
      'Add contact, search contacts, add notes, mark follow-up status, view open follow-up count.',
    ),
    ...CRM_LITE_SUITE,
    productName: 'CRM Lite',
    entityLabel: 'Customer',
    entitySlug: 'customer',
    navLabel: 'Customers',
    hasSearch: true,
    runtimeFilterMode: 'search-only',
    domainDescription: 'Small-team CRM with contacts, notes, and follow-up tracking',
    knownLimitations: [
      'MVP uses universal CRUD shell — advanced pipeline stages may be simplified',
      'Notes and follow-up status depend on generated feature module patterns',
      'No server-side persistence or multi-user collaboration in MVP',
    ],
    behaviourSpecs: [
      behaviour('add-contact', 'Add contact', /add.*contact|create.*contact|add.*customer|addcustomer|add-customer/i),
      behaviour('search-contact', 'Search contact', /search.*contact|search-customer|searchcustomer|search.*customer/i),
      behaviour('add-note', 'Add note to contact', /note|notes|annotation|comment/i, true, 'workflow'),
      behaviour(
        'follow-up-status',
        'Follow-up status',
        /follow.?up|complete.*toggle|status|mark.*complete|filter-active/i,
        true,
        'workflow',
      ),
      behaviour(
        'open-follow-up-count',
        'Open follow-up count',
        /open.*follow|follow.*count|active.*count|customer-count|remaining|pending/i,
        true,
        'ux',
      ),
    ],
  },
  {
    id: 'booking-system',
    productDomain: 'Booking System',
    productRequest:
      'Build a simple booking system where users can create bookings, choose a date and time, enter customer details, cancel bookings, filter upcoming and past bookings, and see the next upcoming booking. It should work in the browser.',
    clarificationAnswers: clarificationAnswers(
      'appointment booking system',
      'Booking',
      'Create booking, choose date/time, enter customer details, cancel booking, filter upcoming/past, show next upcoming booking.',
    ),
    ...BOOKING_SUITE,
    productName: 'Booking System',
    entityLabel: 'Booking',
    entitySlug: 'customer',
    navLabel: 'Customers',
    hasSearch: true,
    runtimeFilterMode: 'search-only',
    domainDescription: 'Browser booking system with date/time selection and customer details',
    knownLimitations: [
      'Codegen profile maps to CRM universal shell — booking-specific calendar UI may be partial',
      'Date/time and cancel flows verified via honest source/runtime pattern checks',
      'No external calendar integrations in MVP',
    ],
    behaviourSpecs: [
      behaviour('create-booking', 'Create booking', /booking|appointment|schedule|create.*record|add.*customer/i),
      behaviour('date-time-field', 'Date and time field', /date|time|datetime|calendar|slot/i, true, 'workflow'),
      behaviour('customer-details', 'Customer details', /customer|client|name|email|phone|details/i),
      behaviour('cancel-booking', 'Cancel booking', /cancel|delete|remove.*booking|handledelete/i, true, 'delete'),
      behaviour(
        'upcoming-past-filter',
        'Upcoming/past filter',
        /upcoming|past|filter|active|completed|all.*past/i,
        true,
        'discoverability',
      ),
      behaviour(
        'next-upcoming-booking',
        'Next upcoming booking',
        /next.*booking|upcoming|next.*appointment|soonest|earliest/i,
        true,
        'ux',
      ),
    ],
  },
  {
    id: 'inventory-manager',
    productDomain: 'Inventory Manager',
    productRequest:
      'Build a simple inventory manager where users can add products, update stock quantity, mark low-stock products, delete products, filter all and low-stock items, and see total inventory value. It should have a clean modern browser UI.',
    clarificationAnswers: clarificationAnswers(
      'inventory manager',
      'Inventory Item/Product',
      'Add product, update stock quantity, mark low-stock, delete product, filter all/low-stock, show total inventory value.',
    ),
    ...INVENTORY_SUITE,
    productName: 'Inventory Manager',
    entityLabel: 'Inventory Item',
    entitySlug: 'inventory-item',
    navLabel: 'Inventory',
    hasSearch: false,
    runtimeFilterMode: 'none',
    domainDescription: 'Inventory manager with stock quantity and low-stock filtering',
    knownLimitations: [
      'Total inventory value depends on generated quantity/price fields',
      'Low-stock threshold logic may be simplified in universal CRUD shell',
      'No warehouse multi-location support in MVP',
    ],
    behaviourSpecs: [
      behaviour('add-product', 'Add product', /add.*product|add.*item|create.*inventory|add.*inventory/i),
      behaviour('update-stock', 'Update stock quantity', /stock|quantity|update.*qty|inventory.*count|edit.*item/i, true, 'workflow'),
      behaviour('low-stock-flag', 'Low-stock flag/filter', /low.?stock|reorder|threshold|filter.*low/i, true, 'discoverability'),
      behaviour('delete-product', 'Delete product', /delete|remove.*item|remove.*product|handledelete/i, true, 'delete'),
      behaviour(
        'total-inventory-value',
        'Total inventory value',
        /total.*value|inventory.*value|sum.*value|total.*inventory|aggregate/i,
        true,
        'ux',
      ),
    ],
  },
  {
    id: 'client-portal',
    productDomain: 'Client Portal',
    productRequest:
      'Build a simple client portal where users can add clients, create project requests, update request status, filter open and completed requests, and see a dashboard count of open requests. It should work in the browser.',
    clarificationAnswers: clarificationAnswers(
      'client portal',
      'Client/Customer and Project Request',
      'Add client, create project request, update request status, filter open/completed requests, dashboard open request count.',
    ),
    ...CLIENT_PORTAL_SUITE,
    productName: 'Client Portal',
    entityLabel: 'Client',
    entitySlug: 'customer',
    navLabel: 'Customers',
    hasSearch: true,
    runtimeFilterMode: 'search-only',
    domainDescription: 'Client portal with project requests and status tracking',
    knownLimitations: [
      'Universal CRM shell may represent clients as customers and requests as records',
      'Separate request entity may be simplified to single primary entity in MVP',
      'No external ticketing integrations in MVP',
    ],
    behaviourSpecs: [
      behaviour('add-client', 'Add client', /add.*client|create.*client|add.*customer|client.*record/i),
      behaviour('create-request', 'Create project request', /request|project.*request|create.*request|ticket/i, true, 'workflow'),
      behaviour('status-update', 'Request status update', /status|complete|update.*status|toggle|workflow/i, true, 'workflow'),
      behaviour(
        'open-completed-filter',
        'Open/completed filter',
        /open|completed|filter|active.*completed|filter-active/i,
        true,
        'discoverability',
      ),
      behaviour(
        'open-request-count',
        'Open request count',
        /open.*request|request.*count|active.*count|dashboard.*count|pending.*count/i,
        true,
        'ux',
      ),
    ],
  },
  {
    id: 'field-service',
    productDomain: 'Field Service App',
    productRequest:
      'Build a simple field service job tracker where users can create jobs, assign a technician name, update job status, filter scheduled and completed jobs, delete jobs, and see a count of active jobs. It should have a clean browser UI.',
    clarificationAnswers: clarificationAnswers(
      'field service job tracker',
      'Job/Work Order',
      'Create job, assign technician name, update job status, filter scheduled/completed, delete job, active job count.',
    ),
    ...FIELD_SERVICE_SUITE,
    productName: 'Field Service App',
    entityLabel: 'Job',
    entitySlug: 'inventory-item',
    navLabel: 'Inventory',
    hasSearch: false,
    runtimeFilterMode: 'none',
    domainDescription: 'Field service job tracker with technician assignment and status filters',
    knownLimitations: [
      'Fleet profile uses inventory universal shell — jobs may map to inventory-item records',
      'Technician assignment verified via honest source pattern checks',
      'No GPS routing or dispatch integrations in MVP',
    ],
    behaviourSpecs: [
      behaviour('create-job', 'Create job', /job|work.?order|create.*job|field.*service|add.*item/i),
      behaviour('technician-assignment', 'Technician assignment', /technician|assign|worker|crew|staff/i, true, 'workflow'),
      behaviour('status-update', 'Job status update', /status|scheduled|completed|in.?progress|toggle/i, true, 'workflow'),
      behaviour(
        'scheduled-completed-filter',
        'Scheduled/completed filter',
        /scheduled|completed|filter|active.*completed|filter-active/i,
        true,
        'discoverability',
      ),
      behaviour('delete-job', 'Delete job', /delete|remove.*job|handledelete|delete-.*button/i, true, 'delete'),
      behaviour('active-job-count', 'Active job count', /active.*job|job.*count|active.*count|pending.*count/i, true, 'ux'),
    ],
  },
] as const;

export function buildScenarioEnrichedPrompt(
  productRequest: string,
  clarificationAnswers: readonly string[],
): string {
  return [
    productRequest,
    '',
    '--- Proof scenario clarification answers ---',
    ...clarificationAnswers,
  ].join('\n');
}
