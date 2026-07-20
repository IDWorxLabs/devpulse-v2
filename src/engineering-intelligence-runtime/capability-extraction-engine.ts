/**
 * Engineering Intelligence Runtime V1 — capability extraction from prompt semantics.
 */

import { classifyProductDomain } from './product-domain-classifier.js';
import type { ProductDomain, RequiredCapability } from './engineering-intelligence-types.js';
import { promptExplicitlyRequiresAuth } from '../universal-build-pipeline-verification/build-profile-policy.js';
import { dedupeModuleIds, normalizeModuleId } from '../prompt-faithful-generation/prompt-module-name-normalizer.js';
import { classifyPaymentIntent } from '../safe-payment-placeholder-policy/index.js';
import { SAFE_PAYMENT_PLACEHOLDER_NOTICE } from '../safe-payment-placeholder-policy/safe-payment-placeholder-types.js';

interface DomainCapabilityCatalogEntry {
  capabilityId: string;
  label: string;
  moduleIds: readonly string[];
  triggers: readonly RegExp[];
  optional?: boolean;
}

const DOMAIN_CAPABILITY_CATALOG: Record<ProductDomain, readonly DomainCapabilityCatalogEntry[]> = {
  'e-commerce': [
    { capabilityId: 'product-catalog', label: 'Product catalog', moduleIds: ['products'], triggers: [/\bproduct\s+catalog\b/i, /\bproducts?\b/i] },
    { capabilityId: 'cart', label: 'Shopping cart', moduleIds: ['cart'], triggers: [/\bshopping\s+cart\b/i, /\bcart\b/i] },
    { capabilityId: 'checkout', label: 'Checkout flow', moduleIds: ['checkout'], triggers: [/\bcheckout\b/i] },
    { capabilityId: 'orders', label: 'Order history', moduleIds: ['orders'], triggers: [/\border\s+history\b/i, /\borders?\b/i] },
    { capabilityId: 'inventory', label: 'Inventory', moduleIds: ['inventory'], triggers: [/\binventory\b/i], optional: true },
    { capabilityId: 'payment-placeholder', label: 'Payment placeholder', moduleIds: ['payments'], triggers: [/\bpayment\b/i, /\bcheckout\b/i], optional: true },
    { capabilityId: 'customer-account', label: 'Customer account', moduleIds: ['account'], triggers: [/\bcustomer\s+account\b/i, /\buser\s+accounts?\b/i], optional: true },
  ],
  marketplace: [
    { capabilityId: 'listings', label: 'Listings', moduleIds: ['listings'], triggers: [/\blistings?\b/i] },
    { capabilityId: 'search', label: 'Search', moduleIds: ['search'], triggers: [/\bsearch\b/i] },
    { capabilityId: 'seller-profiles', label: 'Seller profiles', moduleIds: ['sellers'], triggers: [/\bseller\s+profiles?\b/i, /\bsellers?\b/i] },
    { capabilityId: 'checkout', label: 'Transaction checkout', moduleIds: ['checkout'], triggers: [/\bcheckout\b/i, /\btransaction\b/i] },
  ],
  crm: [
    { capabilityId: 'customers', label: 'Customer records', moduleIds: ['customers'], triggers: [/\bcustomer\s+records?\b/i, /\bcustomers?\b/i] },
    { capabilityId: 'deals', label: 'Deal pipeline', moduleIds: ['deals'], triggers: [/\bdeal\s+pipeline\b/i, /\bdeals?\b/i] },
    { capabilityId: 'activities', label: 'Activity timeline', moduleIds: ['activities'], triggers: [/\bactivity\s+timeline\b/i, /\bactivities\b/i] },
    { capabilityId: 'dashboard', label: 'Team dashboard', moduleIds: ['dashboard'], triggers: [/\bteam\s+dashboard\b/i, /\bdashboard\b/i] },
  ],
  'hr-admin': [
    { capabilityId: 'employees', label: 'Employee directory', moduleIds: ['employees'], triggers: [/\bemployee\s+directory\b/i, /\bemployees?\b/i] },
    { capabilityId: 'onboarding', label: 'Onboarding checklist', moduleIds: ['onboarding'], triggers: [/\bonboarding\b/i] },
    { capabilityId: 'time-off', label: 'Time-off requests', moduleIds: ['time-off'], triggers: [/\btime[\s-]?off\b/i, /\bpto\b/i, /\bleave\s+requests?\b/i] },
    { capabilityId: 'payroll', label: 'Payroll summary', moduleIds: ['payroll'], triggers: [/\bpayroll\b/i] },
    { capabilityId: 'roles-permissions', label: 'Roles and permissions', moduleIds: ['roles'], triggers: [/\broles?\b/i, /\bpermissions?\b/i], optional: true },
    { capabilityId: 'reports', label: 'Reports', moduleIds: ['reports'], triggers: [/\breports?\b/i], optional: true },
  ],
  'ai-chat': [
    { capabilityId: 'conversations', label: 'Conversation list', moduleIds: ['conversations'], triggers: [/\bconversation\s+threads?\b/i, /\bconversations?\b/i] },
    { capabilityId: 'chat-input', label: 'Message composer', moduleIds: ['chat-input'], triggers: [/\bchat[\s-]?input\b/i, /\bprompt\s+input\b/i, /\bmessage\s+composer\b/i] },
    { capabilityId: 'responses', label: 'AI response panel', moduleIds: ['responses'], triggers: [/\bmodel\s+responses?\b/i, /\bresponses?\b/i] },
    { capabilityId: 'history', label: 'Chat history', moduleIds: ['history'], triggers: [/\bchat\s+history\b/i, /\bhistory\s+sidebar\b/i, /\bhistory\b/i] },
    { capabilityId: 'model-settings', label: 'Model/settings placeholder', moduleIds: ['settings'], triggers: [/\bmodel\s+settings\b/i, /\bsettings\b/i], optional: true },
    { capabilityId: 'streaming', label: 'Streaming placeholder', moduleIds: ['streaming'], triggers: [/\bstreaming\b/i], optional: true },
  ],
  'assistive-communication': [
    { capabilityId: 'calibration', label: 'Calibration', moduleIds: ['onboarding-calibration'], triggers: [/\bcalibration\b/i, /\bonboarding[\s/-]?calibration\b/i] },
    { capabilityId: 'blink-simulation', label: 'Blink simulation', moduleIds: ['blink-input-engine'], triggers: [/\bblink\b/i] },
    { capabilityId: 'gaze-board', label: 'Gaze board', moduleIds: ['eye-tracking-board', 'gaze-keyboard'], triggers: [/\bgaze\b/i, /\beye[\s-]?track/i, /\bcommunication[\s-]?board\b/i] },
    { capabilityId: 'text-to-speech', label: 'Text-to-speech', moduleIds: ['text-to-speech'], triggers: [/\btext[\s-]?to[\s-]?speech\b/i, /\btts\b/i] },
    { capabilityId: 'quick-phrases', label: 'Quick phrases', moduleIds: ['quick-phrases'], triggers: [/\bquick[\s-]?phrases?\b/i] },
    { capabilityId: 'caregiver-dashboard', label: 'Caregiver dashboard', moduleIds: ['caregiver-dashboard'], triggers: [/\bcaregiver\b/i] },
    { capabilityId: 'communication-history', label: 'Communication history', moduleIds: ['communication-history'], triggers: [/\bcommunication[\s-]?history\b/i, /\bmessage[\s-]?history\b/i] },
    { capabilityId: 'accessibility-settings', label: 'Accessibility settings', moduleIds: ['accessibility-settings'], triggers: [/\baccessibility\s+settings\b/i] },
    { capabilityId: 'emergency-speech', label: 'Emergency speech', moduleIds: ['emergency-speech'], triggers: [/\bemergency\s+speech\b/i] },
  ],
  'education-lms': [
    { capabilityId: 'courses', label: 'Courses', moduleIds: ['courses'], triggers: [/\bcourses?\b/i] },
    { capabilityId: 'lessons', label: 'Lessons', moduleIds: ['lessons'], triggers: [/\blessons?\b/i] },
    { capabilityId: 'enrollments', label: 'Student enrollments', moduleIds: ['enrollments'], triggers: [/\benrollments?\b/i, /\bstudents?\b/i] },
    { capabilityId: 'quizzes', label: 'Quizzes', moduleIds: ['quizzes'], triggers: [/\bquizzes?\b/i] },
    { capabilityId: 'progress', label: 'Progress tracking', moduleIds: ['progress'], triggers: [/\bprogress\b/i] },
  ],
  'healthcare-portal': [
    { capabilityId: 'appointments', label: 'Appointments', moduleIds: ['appointments'], triggers: [/\bappointments?\b/i] },
    { capabilityId: 'records', label: 'Medical records view', moduleIds: ['records'], triggers: [/\bmedical\s+records?\b/i, /\brecords?\b/i] },
    { capabilityId: 'prescriptions', label: 'Prescriptions list', moduleIds: ['prescriptions'], triggers: [/\bprescriptions?\b/i] },
    { capabilityId: 'messaging', label: 'Secure messaging', moduleIds: ['messaging'], triggers: [/\bsecure\s+messaging\b/i, /\bmessaging\b/i] },
  ],
  'finance-expense': [
    { capabilityId: 'expenses', label: 'Expenses', moduleIds: ['expenses'], triggers: [/\bexpenses?\b/i, /\badd\s+expenses?\b/i] },
    { capabilityId: 'income', label: 'Income', moduleIds: ['income'], triggers: [/\bincome\b/i], optional: true },
    { capabilityId: 'categories', label: 'Categories', moduleIds: ['categories'], triggers: [/\bcategor(?:y|ies|ize)\b/i] },
    { capabilityId: 'charts', label: 'Charts', moduleIds: ['charts'], triggers: [/\bcharts?\b/i], optional: true },
    { capabilityId: 'reports', label: 'Reports', moduleIds: ['reports'], triggers: [/\breports?\b/i], optional: true },
    { capabilityId: 'csv-export', label: 'CSV export', moduleIds: ['export'], triggers: [/\bcsv\s+export\b/i], optional: true },
  ],
  'booking-scheduling': [
    { capabilityId: 'appointments', label: 'Appointments', moduleIds: ['appointments'], triggers: [/\bappointments?\b/i] },
    { capabilityId: 'calendar', label: 'Calendar', moduleIds: ['calendar'], triggers: [/\bcalendar\b/i] },
    { capabilityId: 'availability', label: 'Availability', moduleIds: ['availability'], triggers: [/\bavailability\b/i] },
    { capabilityId: 'reservations', label: 'Reservations', moduleIds: ['reservations'], triggers: [/\breservations?\b/i] },
  ],
  'social-community': [
    { capabilityId: 'profiles', label: 'User profiles', moduleIds: ['profiles'], triggers: [/\buser\s+profiles?\b/i, /\bprofiles?\b/i] },
    { capabilityId: 'posts', label: 'Posts feed', moduleIds: ['posts'], triggers: [/\bposts?\s+feed\b/i, /\bposts?\b/i] },
    { capabilityId: 'comments', label: 'Comments', moduleIds: ['comments'], triggers: [/\bcomments?\b/i] },
    { capabilityId: 'likes', label: 'Likes', moduleIds: ['likes'], triggers: [/\blikes?\b/i], optional: true },
    { capabilityId: 'messages', label: 'Direct messages', moduleIds: ['messages'], triggers: [/\bdirect\s+messages?\b/i, /\bmessages?\b/i] },
  ],
  'developer-tool': [
    { capabilityId: 'api-keys', label: 'API keys', moduleIds: ['api-keys'], triggers: [/\bapi\s+keys?\b/i] },
    { capabilityId: 'request-logs', label: 'Request logs', moduleIds: ['request-logs'], triggers: [/\brequest\s+logs?\b/i] },
    { capabilityId: 'metrics', label: 'Usage metrics', moduleIds: ['metrics'], triggers: [/\busage\s+metrics\b/i, /\bmetrics\b/i] },
    { capabilityId: 'documentation', label: 'Documentation browser', moduleIds: ['documentation'], triggers: [/\bendpoint\s+documentation\b/i, /\bdocumentation\b/i] },
  ],
  'internal-dashboard': [
    { capabilityId: 'dashboard', label: 'Dashboard overview', moduleIds: ['dashboard'], triggers: [/\bdashboard\b/i] },
    { capabilityId: 'analytics', label: 'Analytics', moduleIds: ['analytics'], triggers: [/\banalytics\b/i, /\bkpi\b/i], optional: true },
  ],
  game: [
    { capabilityId: 'levels', label: 'Level select', moduleIds: ['levels'], triggers: [/\blevel\s+select\b/i, /\blevels?\b/i] },
    { capabilityId: 'game-board', label: 'Play board', moduleIds: ['game-board'], triggers: [/\bplay\s+board\b/i, /\bgame[\s-]?board\b/i] },
    { capabilityId: 'score', label: 'Score tracking', moduleIds: ['score'], triggers: [/\bscore\b/i] },
    { capabilityId: 'controls', label: 'Restart controls', moduleIds: ['controls'], triggers: [/\brestart\s+controls?\b/i, /\bcontrols?\b/i] },
  ],
  'custom-general': [],
};

function extractExplicitModulesFromPrompt(rawPrompt: string): string[] {
  const modules: string[] = [];
  const domainNoise = new Set([
    'e-commerce',
    'marketplace',
    'checkout-flow',
    'order-history',
    'product-catalog',
    'shopping-cart',
    'chat-history',
    'prompt-input',
    'model-responses',
    'conversation-threads',
  ]);
  for (const line of rawPrompt.split('\n')) {
    const bullet = line.match(/^\s*[*•-]\s*([a-z][a-z0-9-]{2,40})\s*$/i);
    if (bullet?.[1]) {
      const token = normalizeModuleId(bullet[1]);
      if (!domainNoise.has(token)) modules.push(token);
    }
  }
  for (const match of rawPrompt.matchAll(/\b([a-z][a-z0-9-]{2,40})\s+module\b/gi)) {
    modules.push(normalizeModuleId(match[1] ?? ''));
  }
  return dedupeModuleIds(modules.filter(Boolean));
}

function capabilityFromCatalogEntry(
  entry: DomainCapabilityCatalogEntry,
  rawPrompt: string,
  _forceInclude: boolean,
): RequiredCapability | null {
  const matchedTriggers = entry.triggers.filter((trigger) => trigger.test(rawPrompt));
  // Never invent domain-baseline modules without prompt evidence. Force-including an entire
  // domain catalog (e.g. Expenses from a false finance classification) drifts product truth
  // and breaks CBGA/GPCA when EI regenerates unapproved navigation.
  if (matchedTriggers.length === 0) return null;

  return {
    readOnly: true,
    capabilityId: entry.capabilityId,
    label: entry.label,
    moduleIds: entry.moduleIds,
    optional: entry.optional === true,
    promptEvidence: matchedTriggers.map((t) => `Prompt matches ${t.source}`),
  };
}

export function extractRequiredCapabilities(input: {
  rawPrompt: string;
  domain: ProductDomain;
  extractionRequiredModules?: readonly string[];
}): readonly RequiredCapability[] {
  const catalog = DOMAIN_CAPABILITY_CATALOG[input.domain] ?? [];
  const capabilities: RequiredCapability[] = [];
  const seen = new Set<string>();

  for (const entry of catalog) {
    const capability = capabilityFromCatalogEntry(entry, input.rawPrompt, input.domain !== 'custom-general');
    if (!capability || seen.has(capability.capabilityId)) continue;
    if (capability.capabilityId === 'customer-account' && !promptExplicitlyRequiresAuth(input.rawPrompt)) continue;
    if (capability.capabilityId === 'roles-permissions' && !promptExplicitlyRequiresAuth(input.rawPrompt)) continue;
    if (capability.capabilityId === 'csv-export' && !/\b(csv|export|reporting)\b/i.test(input.rawPrompt)) continue;
    seen.add(capability.capabilityId);
    capabilities.push(capability);
  }

  const explicitModules = [
    ...(input.extractionRequiredModules ?? []),
    ...extractExplicitModulesFromPrompt(input.rawPrompt),
  ];

  for (const moduleId of explicitModules) {
    const existing = capabilities.find((c) => c.moduleIds.includes(moduleId));
    if (existing) continue;
    capabilities.push({
      readOnly: true,
      capabilityId: `prompt-module-${moduleId}`,
      label: moduleId.replace(/-/g, ' '),
      moduleIds: [moduleId],
      optional: false,
      promptEvidence: [`Explicit prompt module mention: ${moduleId}`],
    });
  }

  if (capabilities.length === 0 && input.domain === 'custom-general') {
    const classification = classifyProductDomain(input.rawPrompt);
    if (classification.domain !== 'custom-general') {
      return extractRequiredCapabilities({
        rawPrompt: input.rawPrompt,
        domain: classification.domain,
        extractionRequiredModules: input.extractionRequiredModules,
      });
    }
  }

  const filtered = capabilities.filter(
    (c) => !c.optional || c.promptEvidence.some((e) => /Prompt matches/.test(e)),
  );
  const paymentAssessment = classifyPaymentIntent(input.rawPrompt);
  if (paymentAssessment.classification !== 'SAFE_PAYMENT_PLACEHOLDER') {
    return filtered;
  }

  return filtered.map((capability) => {
    if (
      !/payment|checkout|cart|order/i.test(capability.capabilityId) &&
      !capability.moduleIds.some((m) => ['payments', 'checkout', 'cart', 'orders'].includes(m))
    ) {
      return capability;
    }
    return {
      ...capability,
      promptEvidence: [
        ...capability.promptEvidence,
        `SAFE_PAYMENT_PLACEHOLDER — ${SAFE_PAYMENT_PLACEHOLDER_NOTICE}`,
      ],
    };
  });
}

export function listCapabilityModuleIds(capabilities: readonly RequiredCapability[]): string[] {
  return dedupeModuleIds(capabilities.flatMap((c) => [...c.moduleIds]));
}
