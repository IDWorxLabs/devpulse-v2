/**
 * Product Architect Intelligence V1 — product pattern registry.
 * Expected workflows and capabilities — not hard-coded screen implementations.
 */

import type { ProductArchitectDomain, ProductPatternDefinition } from './product-architect-intelligence-types.js';

function screen(
  label: string,
  patterns: readonly RegExp[],
  critical = false,
): ProductPatternDefinition['expectedScreens'][number] {
  return { readOnly: true, label, detectionPatterns: patterns, critical };
}

function workflow(
  label: string,
  steps: Array<{ label: string; patterns: readonly RegExp[] }>,
  critical = true,
): ProductPatternDefinition['expectedWorkflows'][number] {
  return {
    readOnly: true,
    label,
    critical,
    steps: steps.map((step) => ({
      label: step.label,
      detectionPatterns: step.patterns,
    })),
  };
}

function journey(
  journeyType: ProductPatternDefinition['expectedJourneys'][number]['journeyType'],
  actions: Array<{ label: string; patterns: readonly RegExp[] }>,
): ProductPatternDefinition['expectedJourneys'][number] {
  return {
    readOnly: true,
    journeyType,
    requiredActions: actions.map((action) => ({
      label: action.label,
      detectionPatterns: action.patterns,
    })),
  };
}

export const PRODUCT_PATTERN_REGISTRY: readonly ProductPatternDefinition[] = [
  {
    readOnly: true,
    domain: 'CRM',
    label: 'CRM',
    detectionPatterns: [/\b(crm|customer relationship|lead|sales pipeline|customers)\b/i],
    expectedScreens: [
      screen('Dashboard', [/\b(dashboard|overview|home)\b/i]),
      screen('Leads', [/\b(leads?|prospects?)\b/i], true),
      screen('Customers', [/\b(customers?|accounts?|contacts?)\b/i], true),
      screen('Pipeline', [/\b(pipeline|deal stages?|sales funnel)\b/i], true),
      screen('Activities', [/\b(activities|tasks?|follow-?ups?|calls?)\b/i]),
      screen('Reports', [/\b(reports?|analytics|metrics)\b/i], true),
      screen('Settings', [/\b(settings|configuration|preferences)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Lead to Customer', [
        { label: 'Capture Lead', patterns: [/\b(lead|prospect|capture)\b/i] },
        { label: 'Qualify', patterns: [/\b(qualif|stage|pipeline)\b/i] },
        { label: 'Convert', patterns: [/\b(convert|customer|close)\b/i] },
      ]),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [
        { label: 'Onboard', patterns: [/\b(onboard|welcome|setup|getting started)\b/i] },
        { label: 'Create Record', patterns: [/\b(create|add|new)\b/i] },
      ]),
      journey('Returning User Journey', [
        { label: 'Search', patterns: [/\b(search|find|filter)\b/i] },
        { label: 'Update Record', patterns: [/\b(edit|update|modify)\b/i] },
      ]),
      journey('Power User Journey', [
        { label: 'Bulk Actions', patterns: [/\b(bulk|batch|mass)\b/i] },
        { label: 'Reporting', patterns: [/\b(report|analytics|export)\b/i] },
      ]),
      journey('Admin Journey', [
        { label: 'Manage Users', patterns: [/\b(user|role|permission|admin)\b/i] },
        { label: 'Configure', patterns: [/\b(config|settings|admin)\b/i] },
      ]),
    ],
    expectedRoles: ['Sales', 'Manager', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Roles', 'Missing Reporting', 'Missing Administration'],
  },
  {
    readOnly: true,
    domain: 'MARKETPLACE',
    label: 'Marketplace',
    detectionPatterns: [/\b(marketplace|multi-?vendor|buyers?|sellers?|listings?)\b/i],
    expectedScreens: [
      screen('Listings', [/\b(listings?|catalog|products?)\b/i], true),
      screen('Product Detail', [/\b(product detail|item detail|listing detail)\b/i], true),
      screen('Search', [/\b(search|browse|discover)\b/i], true),
      screen('Cart', [/\b(cart|basket)\b/i]),
      screen('Checkout', [/\b(checkout|payment|pay)\b/i], true),
      screen('Orders', [/\b(orders?|purchases?|order history)\b/i], true),
      screen('Profile', [/\b(profile|account|seller profile|buyer profile)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Purchase Flow', [
        { label: 'Search', patterns: [/\b(search|browse|find)\b/i] },
        { label: 'Select', patterns: [/\b(select|view|detail|listing)\b/i] },
        { label: 'Checkout', patterns: [/\b(checkout|cart|buy)\b/i] },
        { label: 'Order Confirmation', patterns: [/\b(confirm|order|receipt|thank you)\b/i] },
      ]),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [{ label: 'Browse Listings', patterns: [/\b(browse|listing|search)\b/i] }]),
      journey('Returning User Journey', [{ label: 'Track Orders', patterns: [/\b(order|history|track)\b/i] }]),
      journey('Power User Journey', [{ label: 'Manage Listings', patterns: [/\b(manage listings|seller|vendor)\b/i] }]),
      journey('Admin Journey', [{ label: 'Moderate', patterns: [/\b(moderat|admin|approve)\b/i] }]),
    ],
    expectedRoles: ['Buyer', 'Seller', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Monetization', 'Missing Administration'],
  },
  {
    readOnly: true,
    domain: 'INVENTORY',
    label: 'Inventory',
    detectionPatterns: [/\b(inventory|stock|warehouse|sku)\b/i],
    expectedScreens: [
      screen('Dashboard', [/\b(dashboard|overview)\b/i]),
      screen('Items', [/\b(items?|products?|skus?)\b/i], true),
      screen('Stock Levels', [/\b(stock|levels?|quantity|on hand)\b/i], true),
      screen('Receiving', [/\b(receiv|inbound|restock)\b/i]),
      screen('Adjustments', [/\b(adjust|correction|write-?off)\b/i]),
      screen('Reports', [/\b(reports?|analytics)\b/i], true),
      screen('Settings', [/\b(settings|configuration)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Stock Management', [
        { label: 'Add Item', patterns: [/\b(add|create|new)\b/i] },
        { label: 'Track Stock', patterns: [/\b(stock|quantity|inventory)\b/i] },
        { label: 'Adjust', patterns: [/\b(adjust|update|edit)\b/i] },
      ]),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [{ label: 'Add Inventory', patterns: [/\b(add|create|item)\b/i] }]),
      journey('Returning User Journey', [{ label: 'Search Inventory', patterns: [/\b(search|find|filter)\b/i] }]),
      journey('Power User Journey', [{ label: 'Bulk Update', patterns: [/\b(bulk|batch|import)\b/i] }]),
      journey('Admin Journey', [{ label: 'Configure Locations', patterns: [/\b(location|warehouse|admin)\b/i] }]),
    ],
    expectedRoles: ['Operator', 'Manager', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Reporting', 'Missing Administration'],
  },
  {
    readOnly: true,
    domain: 'SCHOOL_MANAGEMENT',
    label: 'School Management',
    detectionPatterns: [/\b(school|students?|teachers?|classes?|education)\b/i],
    expectedScreens: [
      screen('Dashboard', [/\b(dashboard|overview)\b/i]),
      screen('Students', [/\b(students?|enrollment)\b/i], true),
      screen('Teachers', [/\b(teachers?|faculty|staff)\b/i], true),
      screen('Classes', [/\b(classes?|courses?|sections?)\b/i], true),
      screen('Attendance', [/\b(attendance|present|absent)\b/i], true),
      screen('Grades', [/\b(grades?|marks?|assessment)\b/i]),
      screen('Reports', [/\b(reports?|analytics)\b/i]),
      screen('Settings', [/\b(settings|configuration)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Enrollment to Class', [
        { label: 'Enroll Student', patterns: [/\b(enroll|register|student)\b/i] },
        { label: 'Assign Class', patterns: [/\b(assign|class|section)\b/i] },
        { label: 'Track Attendance', patterns: [/\b(attendance|present)\b/i] },
      ]),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [{ label: 'Register Student', patterns: [/\b(register|enroll|student)\b/i] }]),
      journey('Returning User Journey', [{ label: 'View Schedule', patterns: [/\b(schedule|class|calendar)\b/i] }]),
      journey('Power User Journey', [{ label: 'Grade Management', patterns: [/\b(grade|assessment|score)\b/i] }]),
      journey('Admin Journey', [{ label: 'Manage Staff', patterns: [/\b(staff|teacher|admin)\b/i] }]),
    ],
    expectedRoles: ['Student', 'Teacher', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Roles', 'Missing Reporting', 'Missing Administration'],
  },
  {
    readOnly: true,
    domain: 'HEALTHCARE',
    label: 'Healthcare',
    detectionPatterns: [/\b(healthcare|patient|medical|clinic|hospital|portal)\b/i],
    expectedScreens: [
      screen('Dashboard', [/\b(dashboard|overview)\b/i]),
      screen('Patients', [/\b(patients?|records?)\b/i], true),
      screen('Appointments', [/\b(appointments?|scheduling|visits?)\b/i], true),
      screen('Providers', [/\b(providers?|doctors?|physicians?)\b/i]),
      screen('Prescriptions', [/\b(prescriptions?|medications?|rx)\b/i]),
      screen('Billing', [/\b(billing|claims?|insurance)\b/i]),
      screen('Reports', [/\b(reports?|analytics)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Patient Visit', [
        { label: 'Schedule', patterns: [/\b(schedule|appointment|book)\b/i] },
        { label: 'Check In', patterns: [/\b(check-?in|arrival|visit)\b/i] },
        { label: 'Document Care', patterns: [/\b(document|notes?|record|chart)\b/i] },
      ]),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [{ label: 'Register Patient', patterns: [/\b(register|patient|intake)\b/i] }]),
      journey('Returning User Journey', [{ label: 'Book Appointment', patterns: [/\b(book|appointment|schedule)\b/i] }]),
      journey('Power User Journey', [{ label: 'Clinical Notes', patterns: [/\b(clinical|notes?|chart)\b/i] }]),
      journey('Admin Journey', [{ label: 'Compliance Settings', patterns: [/\b(compliance|hipaa|admin|privacy)\b/i] }]),
    ],
    expectedRoles: ['Patient', 'Provider', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Roles', 'Missing Permissions', 'Missing Administration'],
  },
  {
    readOnly: true,
    domain: 'FINANCE',
    label: 'Finance',
    detectionPatterns: [/\b(finance|budget|expense|invoice|accounting|ledger)\b/i],
    expectedScreens: [
      screen('Dashboard', [/\b(dashboard|overview)\b/i], true),
      screen('Transactions', [/\b(transactions?|entries?|ledger)\b/i], true),
      screen('Accounts', [/\b(accounts?|chart of accounts)\b/i], true),
      screen('Invoices', [/\b(invoices?|billing)\b/i]),
      screen('Reports', [/\b(reports?|statements?|analytics)\b/i], true),
      screen('Settings', [/\b(settings|configuration)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Record to Report', [
        { label: 'Capture Transaction', patterns: [/\b(transaction|expense|income|record)\b/i] },
        { label: 'Categorize', patterns: [/\b(categor|account|classify)\b/i] },
        { label: 'Report', patterns: [/\b(report|statement|summary)\b/i] },
      ]),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [{ label: 'Setup Accounts', patterns: [/\b(setup|account|configure)\b/i] }]),
      journey('Returning User Journey', [{ label: 'Log Expense', patterns: [/\b(expense|transaction|log)\b/i] }]),
      journey('Power User Journey', [{ label: 'Reconcile', patterns: [/\b(reconcil|match|bank)\b/i] }]),
      journey('Admin Journey', [{ label: 'Audit Access', patterns: [/\b(audit|permission|admin)\b/i] }]),
    ],
    expectedRoles: ['Accountant', 'Manager', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Reporting', 'Missing Permissions', 'Missing Administration'],
  },
  {
    readOnly: true,
    domain: 'BOOKING',
    label: 'Booking',
    detectionPatterns: [/\b(booking|reservation|schedule|calendar|availability)\b/i],
    expectedScreens: [
      screen('Search', [/\b(search|browse|discover)\b/i], true),
      screen('Availability', [/\b(availability|calendar|slots?)\b/i], true),
      screen('Booking Detail', [/\b(booking detail|reservation detail)\b/i]),
      screen('Checkout', [/\b(checkout|payment|pay)\b/i], true),
      screen('Confirmation', [/\b(confirm|confirmation|receipt)\b/i], true),
      screen('My Bookings', [/\b(my bookings|reservations?|history)\b/i], true),
      screen('Settings', [/\b(settings|profile|account)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Booking Flow', [
        { label: 'Search', patterns: [/\b(search|find|browse)\b/i] },
        { label: 'Select', patterns: [/\b(select|choose|slot|time)\b/i] },
        { label: 'Book', patterns: [/\b(book|reserve|schedule)\b/i] },
        { label: 'Pay', patterns: [/\b(pay|payment|checkout)\b/i] },
        { label: 'Confirmation', patterns: [/\b(confirm|confirmation|receipt)\b/i] },
      ], true),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [{ label: 'Find Availability', patterns: [/\b(availability|calendar|search)\b/i] }]),
      journey('Returning User Journey', [{ label: 'Manage Booking', patterns: [/\b(manage|cancel|reschedule|booking)\b/i] }]),
      journey('Power User Journey', [{ label: 'Bulk Scheduling', patterns: [/\b(bulk|batch|schedule)\b/i] }]),
      journey('Admin Journey', [{ label: 'Configure Services', patterns: [/\b(service|admin|configure)\b/i] }]),
    ],
    expectedRoles: ['Customer', 'Provider', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Monetization', 'Missing Administration'],
  },
  {
    readOnly: true,
    domain: 'RESTAURANT_POS',
    label: 'Restaurant POS',
    detectionPatterns: [/\b(restaurant|pos|point of sale|menu|orders?|table)\b/i],
    expectedScreens: [
      screen('Floor Plan', [/\b(floor|tables?|dining)\b/i]),
      screen('Menu', [/\b(menu|items?|dishes?)\b/i], true),
      screen('Orders', [/\b(orders?|tickets?)\b/i], true),
      screen('Kitchen', [/\b(kitchen|prep|back of house)\b/i]),
      screen('Payments', [/\b(payment|checkout|pay|tip)\b/i], true),
      screen('Reports', [/\b(reports?|sales|analytics)\b/i]),
      screen('Settings', [/\b(settings|configuration)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Order to Payment', [
        { label: 'Take Order', patterns: [/\b(order|ticket|menu)\b/i] },
        { label: 'Prepare', patterns: [/\b(kitchen|prepare|prep)\b/i] },
        { label: 'Pay', patterns: [/\b(pay|payment|checkout|tip)\b/i] },
      ]),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [{ label: 'Open Shift', patterns: [/\b(shift|open|start)\b/i] }]),
      journey('Returning User Journey', [{ label: 'Process Order', patterns: [/\b(order|ticket|menu)\b/i] }]),
      journey('Power User Journey', [{ label: 'Split Bill', patterns: [/\b(split|bill|check)\b/i] }]),
      journey('Admin Journey', [{ label: 'Menu Management', patterns: [/\b(menu|admin|configure)\b/i] }]),
    ],
    expectedRoles: ['Server', 'Manager', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Reporting', 'Missing Administration'],
  },
  {
    readOnly: true,
    domain: 'PROJECT_MANAGEMENT',
    label: 'Project Management',
    detectionPatterns: [/\b(project management|projects?|tasks?|kanban|sprints?)\b/i],
    expectedScreens: [
      screen('Dashboard', [/\b(dashboard|overview)\b/i]),
      screen('Projects', [/\b(projects?)\b/i], true),
      screen('Tasks', [/\b(tasks?|issues?|tickets?)\b/i], true),
      screen('Team', [/\b(team|members?|assign)\b/i], true),
      screen('Timeline', [/\b(timeline|gantt|milestones?|schedule)\b/i]),
      screen('Reports', [/\b(reports?|analytics|progress)\b/i]),
      screen('Settings', [/\b(settings|configuration)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Project Delivery', [
        { label: 'Create Project', patterns: [/\b(create|new|project)\b/i] },
        { label: 'Assign Tasks', patterns: [/\b(assign|task|team)\b/i] },
        { label: 'Track Progress', patterns: [/\b(track|progress|status|complete)\b/i] },
      ]),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [{ label: 'Create Project', patterns: [/\b(create|project|new)\b/i] }]),
      journey('Returning User Journey', [{ label: 'Update Tasks', patterns: [/\b(task|update|edit)\b/i] }]),
      journey('Power User Journey', [{ label: 'Cross-Project View', patterns: [/\b(portfolio|cross|all projects)\b/i] }]),
      journey('Admin Journey', [{ label: 'Manage Permissions', patterns: [/\b(permission|role|admin)\b/i] }]),
    ],
    expectedRoles: ['Contributor', 'Manager', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Roles', 'Missing Reporting', 'Missing Administration'],
  },
  {
    readOnly: true,
    domain: 'HR',
    label: 'HR',
    detectionPatterns: [/\b(hr|human resources|employees?|payroll|hiring|recruiting)\b/i],
    expectedScreens: [
      screen('Dashboard', [/\b(dashboard|overview)\b/i]),
      screen('Employees', [/\b(employees?|staff|people)\b/i], true),
      screen('Recruiting', [/\b(recruit|hiring|candidates?|jobs?)\b/i]),
      screen('Time Off', [/\b(time off|leave|pto|vacation)\b/i]),
      screen('Payroll', [/\b(payroll|compensation|salary)\b/i], true),
      screen('Reports', [/\b(reports?|analytics)\b/i]),
      screen('Settings', [/\b(settings|configuration)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Hire to Onboard', [
        { label: 'Post Role', patterns: [/\b(post|job|recruit|hire)\b/i] },
        { label: 'Hire Candidate', patterns: [/\b(hire|candidate|offer)\b/i] },
        { label: 'Onboard', patterns: [/\b(onboard|employee|start)\b/i] },
      ]),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [{ label: 'Add Employee', patterns: [/\b(add|employee|new)\b/i] }]),
      journey('Returning User Journey', [{ label: 'Request Time Off', patterns: [/\b(time off|leave|pto)\b/i] }]),
      journey('Power User Journey', [{ label: 'Run Payroll', patterns: [/\b(payroll|compensation)\b/i] }]),
      journey('Admin Journey', [{ label: 'Policy Settings', patterns: [/\b(policy|admin|settings)\b/i] }]),
    ],
    expectedRoles: ['Employee', 'Manager', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Roles', 'Missing Permissions', 'Missing Administration'],
  },
  {
    readOnly: true,
    domain: 'COMMUNITY_PLATFORM',
    label: 'Community Platform',
    detectionPatterns: [/\b(community|forum|social|groups?|members?|posts?)\b/i],
    expectedScreens: [
      screen('Feed', [/\b(feed|home|timeline)\b/i], true),
      screen('Groups', [/\b(groups?|communities?|spaces?)\b/i], true),
      screen('Messages', [/\b(messages?|chat|dm|inbox)\b/i]),
      screen('Notifications', [/\b(notifications?|alerts?)\b/i], true),
      screen('Profile', [/\b(profile|account|member)\b/i], true),
      screen('Moderation', [/\b(moderat|report|flag)\b/i]),
      screen('Settings', [/\b(settings|preferences)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Join and Participate', [
        { label: 'Discover', patterns: [/\b(discover|browse|explore|feed)\b/i] },
        { label: 'Join', patterns: [/\b(join|follow|subscribe|member)\b/i] },
        { label: 'Post', patterns: [/\b(post|share|comment|publish)\b/i] },
      ]),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [{ label: 'Create Profile', patterns: [/\b(profile|signup|register)\b/i] }]),
      journey('Returning User Journey', [{ label: 'Engage Feed', patterns: [/\b(feed|post|comment)\b/i] }]),
      journey('Power User Journey', [{ label: 'Create Group', patterns: [/\b(group|community|create)\b/i] }]),
      journey('Admin Journey', [{ label: 'Moderate Content', patterns: [/\b(moderat|admin|report)\b/i] }]),
    ],
    expectedRoles: ['Member', 'Moderator', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Notifications', 'Missing Administration'],
  },
  {
    readOnly: true,
    domain: 'LEARNING_PLATFORM',
    label: 'Learning Platform',
    detectionPatterns: [/\b(learning|course|lesson|student|lms|education platform)\b/i],
    expectedScreens: [
      screen('Catalog', [/\b(catalog|courses?|library)\b/i], true),
      screen('Course Detail', [/\b(course detail|lesson|module)\b/i], true),
      screen('Progress', [/\b(progress|completion|tracking)\b/i], true),
      screen('Assessments', [/\b(assessment|quiz|exam|test)\b/i], true),
      screen('Certificates', [/\b(certificate|credential|badge)\b/i]),
      screen('Profile', [/\b(profile|account|student)\b/i]),
      screen('Settings', [/\b(settings|configuration)\b/i]),
    ],
    expectedWorkflows: [
      workflow('Learn and Complete', [
        { label: 'Enroll', patterns: [/\b(enroll|register|join|course)\b/i] },
        { label: 'Learn', patterns: [/\b(learn|lesson|module|content)\b/i] },
        { label: 'Assess', patterns: [/\b(assess|quiz|exam|test)\b/i] },
        { label: 'Complete', patterns: [/\b(complete|finish|certificate|progress)\b/i] },
      ]),
    ],
    expectedJourneys: [
      journey('First-Time User Journey', [{ label: 'Browse Courses', patterns: [/\b(browse|catalog|course)\b/i] }]),
      journey('Returning User Journey', [{ label: 'Resume Learning', patterns: [/\b(resume|continue|progress)\b/i] }]),
      journey('Power User Journey', [{ label: 'Create Course', patterns: [/\b(create course|instructor|author)\b/i] }]),
      journey('Admin Journey', [{ label: 'Manage Learners', patterns: [/\b(manage|admin|learners?)\b/i] }]),
    ],
    expectedRoles: ['Learner', 'Instructor', 'Admin'],
    gapCategories: ['Missing Screens', 'Missing Workflows', 'Missing Roles', 'Missing Reporting', 'Missing Administration'],
  },
];

export function detectProductArchitectDomain(evidenceText: string): ProductArchitectDomain {
  for (const pattern of PRODUCT_PATTERN_REGISTRY) {
    if (pattern.detectionPatterns.some((re) => re.test(evidenceText))) {
      return pattern.domain;
    }
  }
  return 'GENERIC';
}

export function resolveProductPattern(domain: ProductArchitectDomain): ProductPatternDefinition | null {
  if (domain === 'GENERIC') return null;
  return PRODUCT_PATTERN_REGISTRY.find((pattern) => pattern.domain === domain) ?? null;
}

export function matchesAnyPattern(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}
