/**
 * Command Center product identity responses — Phase 24.9.1.
 * Product-first answers for founder and customer prompts. Architecture only on explicit request.
 */

export type ProductIdentityIntent =
  | 'WHAT_IS_AIDEVENGINE'
  | 'WHAT_CAN_DO'
  | 'WHY_USE'
  | 'HELP_BUILD_APP'
  | 'BUILD_CRM'
  | 'BUILD_FIELD_SERVICE'
  | 'BUILD_CUSTOMER_PORTAL'
  | 'BUILD_ECOMMERCE'
  | 'BUILD_DISPATCH'
  | 'IDEA_TO_APP'
  | 'AFTER_CREATE_PROJECT'
  | 'PROJECT_MEMORY'
  | 'PROJECT_INSIGHTS'
  | 'MEMORY_VS_INSIGHTS'
  | 'LIVE_PREVIEW'
  | 'VERIFY_PROJECT'
  | 'WHAT_NEXT'
  | 'WHAT_CAN_BUILD_HERE';

export const MANDATORY_PRODUCT_IDENTITY_PROMPTS = [
  'What is AiDevEngine?',
  'What can AiDevEngine do for me?',
  'Help me build an app.',
  'Build a CRM.',
  'Build a field service app.',
  'Build a customer portal.',
  'How do I turn my idea into an app?',
  'What happens after I create a project?',
  'What is Project Memory?',
  'What is Live Preview?',
  'How do I verify my project?',
  'What should I do next?',
] as const;

const ARCHITECTURE_EXPLICIT_PATTERNS: RegExp[] = [
  /\bdevpulse\s*v2\b/i,
  /\bownership registry\b/i,
  /\bunified decision layer\b/i,
  /\bfoundation stack/i,
  /\bwhat phase\b/i,
  /\bphase\s*\d/i,
  /\bregistry\b/i,
  /\bauthority chain\b/i,
  /\binternal (?:architecture|system)/i,
  /\bexplain.*architecture\b/i,
];

const INTENT_MATCHERS: ReadonlyArray<{ intent: ProductIdentityIntent; patterns: RegExp[] }> = [
  {
    intent: 'WHAT_IS_AIDEVENGINE',
    patterns: [/^what is aidevengine\??$/i, /^tell me about aidevengine\??$/i],
  },
  {
    intent: 'WHAT_CAN_DO',
    patterns: [
      /^what can aidevengine do(?: for me)?\??$/i,
      /^what does aidevengine do\??$/i,
    ],
  },
  {
    intent: 'WHY_USE',
    patterns: [/^why should i use aidevengine\??$/i, /^why use aidevengine\??$/i],
  },
  {
    intent: 'PROJECT_MEMORY',
    patterns: [/^what is project memory\??$/i, /^explain project memory\??$/i],
  },
  {
    intent: 'PROJECT_INSIGHTS',
    patterns: [/^what is project insights\??$/i, /^explain project insights\??$/i],
  },
  {
    intent: 'MEMORY_VS_INSIGHTS',
    patterns: [
      /^what(?:'s| is) the difference between project memory and project insights\??$/i,
      /^project memory vs project insights\??$/i,
      /^difference between project memory and project insights\??$/i,
    ],
  },
  {
    intent: 'LIVE_PREVIEW',
    patterns: [/^what is live preview\??$/i, /^explain live preview\??$/i],
  },
  {
    intent: 'VERIFY_PROJECT',
    patterns: [
      /^how do i verify my project\??$/i,
      /^how do i verify\b/i,
      /^how can i verify my project\??$/i,
    ],
  },
  {
    intent: 'WHAT_NEXT',
    patterns: [/^what should i do next\??$/i, /^what do i do next\??$/i],
  },
  {
    intent: 'IDEA_TO_APP',
    patterns: [
      /^how do i turn my idea into an app\??$/i,
      /^how do i turn an idea into an app\??$/i,
      /^turn my idea into an app\??$/i,
    ],
  },
  {
    intent: 'AFTER_CREATE_PROJECT',
    patterns: [
      /^what happens after i create a project\??$/i,
      /^after i create a project\b/i,
    ],
  },
  {
    intent: 'WHAT_CAN_BUILD_HERE',
    patterns: [/^what can i build here\??$/i, /^what can i build\??$/i],
  },
  {
    intent: 'HELP_BUILD_APP',
    patterns: [
      /^help me build an app\.?$/i,
      /^help me start a new app\.?$/i,
      /^help me build\b/i,
      /^help me start\b/i,
    ],
  },
  {
    intent: 'BUILD_CRM',
    patterns: [/^build a crm\.?$/i, /^build crm\b/i, /^i want to build a crm\b/i],
  },
  {
    intent: 'BUILD_FIELD_SERVICE',
    patterns: [
      /^build a field service app\.?$/i,
      /^build field service\b/i,
      /^build a field service\b/i,
    ],
  },
  {
    intent: 'BUILD_CUSTOMER_PORTAL',
    patterns: [
      /^build a customer portal\.?$/i,
      /^build customer portal\b/i,
    ],
  },
  {
    intent: 'BUILD_ECOMMERCE',
    patterns: [
      /^build an e-?commerce platform\.?$/i,
      /^build e-?commerce\b/i,
    ],
  },
  {
    intent: 'BUILD_DISPATCH',
    patterns: [/^build a dispatch system\.?$/i, /^build dispatch\b/i],
  },
];

function normalizeMessage(message: string): string {
  return message.trim().replace(/\s+/g, ' ');
}

export function isExplicitArchitectureRequest(message: string): boolean {
  const normalized = normalizeMessage(message);
  if (/^what is (?:devpulse|devpulse v2)\??$/i.test(normalized)) return false;
  return ARCHITECTURE_EXPLICIT_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function matchProductIdentityIntent(message: string): ProductIdentityIntent | null {
  const normalized = normalizeMessage(message);
  if (!normalized || isExplicitArchitectureRequest(normalized)) return null;

  for (const entry of INTENT_MATCHERS) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return entry.intent;
    }
  }

  if (/^build a\b/i.test(normalized) && normalized.length < 80) {
    if (/crm/i.test(normalized)) return 'BUILD_CRM';
    if (/field service/i.test(normalized)) return 'BUILD_FIELD_SERVICE';
    if (/customer portal/i.test(normalized)) return 'BUILD_CUSTOMER_PORTAL';
    if (/e-?commerce/i.test(normalized)) return 'BUILD_ECOMMERCE';
    if (/dispatch/i.test(normalized)) return 'BUILD_DISPATCH';
    return 'HELP_BUILD_APP';
  }

  return null;
}

const PRODUCT_INTRO = `AiDevEngine helps turn software ideas into working applications.

I can help you:
• create projects
• define requirements
• plan systems
• review architecture
• understand project status
• prepare for verification
• prepare for launch`;

function withNextAction(body: string, nextAction: string): string {
  return `${body}\n\nNext action: ${nextAction}`;
}

function buildAppResponse(input: {
  productGoal: string;
  summary: string;
  requirements: string[];
  entities: string[];
  nextAction: string;
}): string {
  return [
    `AiDevEngine can help you build ${input.productGoal}.`,
    '',
    'Project summary:',
    input.summary,
    '',
    'Requirements direction:',
    ...input.requirements.map((r) => `• ${r}`),
    '',
    'Core entities:',
    ...input.entities.map((e) => `• ${e}`),
    '',
    'Implementation path:',
    '• Refine requirements → plan the application → build features → preview progress → verify quality before launch',
    '',
    `Next action: ${input.nextAction}`,
  ].join('\n');
}

export function generateProductIdentityResponse(intent: ProductIdentityIntent): string {
  switch (intent) {
    case 'WHAT_IS_AIDEVENGINE':
      return withNextAction(
        `${PRODUCT_INTRO}\n\nTell me what you want to build.`,
        'Describe your product idea — for example: "Build a CRM for my sales team."',
      );

    case 'WHAT_CAN_DO':
    case 'WHY_USE':
    case 'WHAT_CAN_BUILD_HERE':
      return withNextAction(
        `${PRODUCT_INTRO}\n\nAiDevEngine guides you from idea to application with planning, requirements, architecture review, implementation support, preview, and verification.`,
        'Start by telling me what application you want to create.',
      );

    case 'HELP_BUILD_APP':
      return withNextAction(
        `I can help you build a new application with AiDevEngine.\n\nWe'll work through:\n• project creation\n• requirements and scope\n• system planning\n• implementation direction\n• preview and verification\n• launch readiness`,
        'Describe the app you want — who it is for and what problem it solves.',
      );

    case 'BUILD_CRM':
      return buildAppResponse({
        productGoal: 'a CRM',
        summary:
          'A customer relationship management application to track leads, accounts, contacts, deals, and sales activity.',
        requirements: [
          'Capture and qualify leads with pipeline stages',
          'Manage accounts, contacts, and communication history',
          'Track deals, forecasts, and sales tasks',
          'Provide dashboards for pipeline health and team activity',
        ],
        entities: ['Lead', 'Account', 'Contact', 'Deal', 'Activity', 'User'],
        nextAction: 'Tell me your target customers and must-have CRM features to refine requirements.',
      });

    case 'BUILD_FIELD_SERVICE':
      return buildAppResponse({
        productGoal: 'a field service app',
        summary:
          'A field service application to schedule technicians, dispatch work orders, and complete jobs in the field.',
        requirements: [
          'Create and assign work orders with priority and location',
          'Schedule technicians and track job status in real time',
          'Capture job notes, photos, signatures, and parts used',
          'Support customer notifications and service history',
        ],
        entities: ['Work Order', 'Technician', 'Customer', 'Job Site', 'Schedule', 'Service Report'],
        nextAction: 'Describe your service workflow — dispatch rules, mobile needs, and billing integration.',
      });

    case 'BUILD_CUSTOMER_PORTAL':
      return buildAppResponse({
        productGoal: 'a customer portal',
        summary:
          'A customer portal where clients sign in, view account information, submit requests, and track service or order status.',
        requirements: [
          'Secure customer sign-in and profile management',
          'Self-service requests, tickets, or order tracking',
          'Document and billing visibility where appropriate',
          'Notifications for status changes and responses',
        ],
        entities: ['Customer Account', 'Request', 'Ticket', 'Document', 'Notification', 'User Session'],
        nextAction: 'Tell me what customers should be able to do in the portal on day one.',
      });

    case 'BUILD_ECOMMERCE':
      return buildAppResponse({
        productGoal: 'an e-commerce platform',
        summary:
          'An online store where customers browse products, manage carts, checkout, and track orders.',
        requirements: [
          'Product catalog with categories, pricing, and inventory',
          'Shopping cart and secure checkout flow',
          'Order management and fulfillment tracking',
          'Customer accounts and purchase history',
        ],
        entities: ['Product', 'Cart', 'Order', 'Customer', 'Payment', 'Shipment'],
        nextAction: 'Share your product catalog model and whether you need B2C, B2B, or marketplace features.',
      });

    case 'BUILD_DISPATCH':
      return buildAppResponse({
        productGoal: 'a dispatch system',
        summary:
          'A dispatch system to assign jobs, route field teams, and monitor completion across operations.',
        requirements: [
          'Intake and prioritize dispatch jobs',
          'Assign drivers or technicians with routing context',
          'Track job progress, delays, and completion proof',
          'Provide operations dashboards and customer updates',
        ],
        entities: ['Dispatch Job', 'Driver', 'Route', 'Customer', 'Status Event', 'Operations Dashboard'],
        nextAction: 'Describe dispatch volume, routing needs, and mobile requirements for your team.',
      });

    case 'IDEA_TO_APP':
      return withNextAction(
        `Turning an idea into an app with AiDevEngine follows a clear path:\n\n1. Create a project and describe your idea\n2. Define requirements and core user workflows\n3. Plan the system and application structure\n4. Implement features with guided development support\n5. Preview the application as it takes shape\n6. Verify quality and launch readiness`,
        'Start by creating a project and telling me what you want to build.',
      );

    case 'AFTER_CREATE_PROJECT':
      return withNextAction(
        `After you create a project, AiDevEngine:\n\n• stores what it knows in Project Memory\n• helps refine requirements and planning\n• guides architecture and implementation decisions\n• prepares Live Preview so you can see progress\n• runs verification to assess quality and launch readiness\n• recommends practical next actions as the project evolves`,
        'Open your project and ask: "What should I do next?"',
      );

    case 'PROJECT_MEMORY':
      return withNextAction(
        `Project Memory is what AiDevEngine knows about your project — requirements, goals, architecture, decisions, facts, conversations, and history.\n\nThis is your project's memory. It stores information as you build.`,
        'Open Project Memory to review stored requirements, architecture, and facts.',
      );

    case 'PROJECT_INSIGHTS':
      return withNextAction(
        `Project Insights is what AiDevEngine thinks about your project — health, risks, progress, recommendations, blockers, and launch readiness.\n\nThis is your project's intelligence. Insights are generated from Project Memory.`,
        'Open Project Insights for health, risks, and recommended next actions.',
      );

    case 'MEMORY_VS_INSIGHTS':
      return withNextAction(
        `Project Memory and Project Insights work together:\n\n• **Project Memory** — what AiDevEngine **knows** (requirements, architecture, facts, history)\n• **Project Insights** — what AiDevEngine **thinks** (health, risks, progress, next actions, launch readiness)\n\nFlow: Project Memory → AiDevEngine Analysis → Project Insights\n\nInsights come from Memory. Memory does not come from Insights.`,
        'Use Project Memory to review stored knowledge. Use Project Insights for recommendations and next steps.',
      );

    case 'LIVE_PREVIEW':
      return withNextAction(
        `Live Preview is where you see and validate what AiDevEngine is building — a running view of your application so you can confirm behavior, design, and progress before launch.`,
        'Select a project and open Live Preview to review the current build.',
      );

    case 'VERIFY_PROJECT':
      return withNextAction(
        `Verification helps you evaluate readiness, quality, and launch confidence for your project.\n\nAiDevEngine checks planning completeness, implementation quality signals, preview readiness, and launch criteria — then recommends what to fix or confirm next.`,
        'Open Verification for your project and review the readiness summary.',
      );

    case 'WHAT_NEXT':
      return withNextAction(
        `Here is a practical path forward with AiDevEngine:\n\n• If you have no project yet — create one and describe your product idea\n• If requirements are unclear — define users, workflows, and must-have features\n• If planning is underway — review architecture and implementation priorities\n• If you have a build in progress — open Live Preview and verify quality\n• If you are near launch — run verification and confirm launch readiness`,
        'Tell me your current stage — idea, planning, building, preview, or launch — and I will narrow this down.',
      );

    default:
      return withNextAction(PRODUCT_INTRO, 'Tell me what you want to build.');
  }
}

export function resolveProductIdentityResponse(message: string): string | null {
  const intent = matchProductIdentityIntent(message);
  if (!intent) return null;
  return generateProductIdentityResponse(intent);
}
