/**
 * General-Purpose Code Generation V1 — app model builder.
 */

import { resolveProductPattern } from '../product-architect-intelligence-v1/product-pattern-registry.js';
import type { ProductArchitectDomain } from '../product-architect-intelligence-v1/product-architect-intelligence-types.js';
import type { GeneralPurposeProofSuiteEntry } from './general-purpose-code-generation-v1-suite-registry.js';
import { routeGenerationStrategy } from './generation-strategy-router.js';
import type {
  GeneralPurposeAppModel,
  GeneralPurposeDomainLogic,
  GeneralPurposeEntity,
  GeneralPurposeRole,
  GeneralPurposeScreen,
  GeneralPurposeWorkflow,
} from './general-purpose-code-generation-v1-types.js';

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function domainLogicForStrategy(strategy: string, domain: string): GeneralPurposeDomainLogic[] {
  const map: Record<string, GeneralPurposeDomainLogic[]> = {
    MARKETPLACE_APP: [
      { readOnly: true, id: 'order-status', label: 'Order Status Timeline', indicatorType: 'timeline', description: 'Shows order progression states' },
    ],
    BOOKING_APP: [
      { readOnly: true, id: 'booking-conflict', label: 'Booking Conflict Warning', indicatorType: 'warning', description: 'Warns when slot unavailable' },
    ],
    WORKFLOW_APP: [
      { readOnly: true, id: 'ticket-priority', label: 'Ticket Priority Indicator', indicatorType: 'badge', description: 'Visual priority for support tickets' },
    ],
    CONTENT_APP: [
      { readOnly: true, id: 'course-progress', label: 'Course Progress Tracker', indicatorType: 'progress', description: 'Tracks lesson completion percent' },
    ],
    DASHBOARD_APP: [
      { readOnly: true, id: 'invoice-status', label: 'Invoice Status Badge', indicatorType: 'badge', description: 'Finance transaction status indicator' },
    ],
    PORTAL_APP: [
      { readOnly: true, id: 'appointment-status', label: 'Appointment Status', indicatorType: 'badge', description: 'Healthcare appointment state' },
    ],
    COMMUNITY_APP: [
      { readOnly: true, id: 'member-activity', label: 'Member Activity Feed', indicatorType: 'feed', description: 'Community activity visibility' },
    ],
  };

  if (domain === 'INVENTORY' || domain === 'PROPERTY') {
    return [
      { readOnly: true, id: 'low-stock', label: 'Low Stock Warning', indicatorType: 'warning', description: 'Alerts when inventory below threshold' },
    ];
  }

  return map[strategy] ?? [
    { readOnly: true, id: 'status-badge', label: 'Status Indicator', indicatorType: 'badge', description: `Domain logic for ${domain}` },
  ];
}

export function buildGeneralPurposeAppModel(input: {
  suiteEntry: GeneralPurposeProofSuiteEntry;
}): GeneralPurposeAppModel {
  const { suiteEntry } = input;
  const routed = routeGenerationStrategy({
    prompt: suiteEntry.prompt,
    domain: suiteEntry.domain,
    strategyHint: suiteEntry.strategy,
  });

  const pattern = resolveProductPattern(routed.domain as ProductArchitectDomain);

  const entities: GeneralPurposeEntity[] = routed.definition.requiredEntities.map((label, index) => ({
    readOnly: true,
    id: slugify(label),
    label,
    pluralLabel: `${label}s`,
    primary: index === 0,
  }));

  const workflows: GeneralPurposeWorkflow[] = pattern?.expectedWorkflows.length
    ? pattern.expectedWorkflows.map((wf) => ({
        readOnly: true,
        id: slugify(wf.label),
        label: wf.label,
        steps: wf.steps.map((s) => s.label),
        critical: wf.critical,
      }))
    : [
        {
          readOnly: true,
          id: 'primary-workflow',
          label: 'Primary Workflow',
          steps: [...routed.definition.expectedWorkflows],
          critical: true,
        },
      ];

  const roles: GeneralPurposeRole[] = (pattern?.expectedRoles.length
    ? pattern.expectedRoles
    : routed.definition.userRoles
  ).map((role) => ({
    readOnly: true,
    id: slugify(role),
    label: role,
    permissions: [`view_${slugify(role)}`, `manage_${slugify(role)}`],
  }));

  const screens: GeneralPurposeScreen[] = (pattern?.expectedScreens ?? routed.definition.screenExpectations.map((label) => ({
    readOnly: true as const,
    label,
    detectionPatterns: [] as readonly RegExp[],
    critical: true,
  }))).map((screen) => ({
    readOnly: true,
    id: slugify(screen.label),
    label: screen.label,
    screenType: screen.label,
    critical: screen.critical,
  }));

  const logic = domainLogicForStrategy(routed.strategy, suiteEntry.domain);

  return {
    readOnly: true,
    appType: routed.definition.label,
    domain: suiteEntry.domain,
    strategy: routed.strategy,
    profile: suiteEntry.profile,
    productName: suiteEntry.productName,
    prompt: suiteEntry.prompt,
    entities,
    roles,
    permissions: roles.flatMap((r) => r.permissions),
    workflows,
    screens,
    actions: routed.definition.expectedWorkflows,
    dataModels: entities.map((e) => e.label),
    automations: ['Status transition hooks', 'Validation on save'],
    integrations: ['Export placeholder', 'Notification placeholder'],
    aiFeatures: routed.strategy === 'AI_ASSISTED_APP' ? ['Prompt assistant placeholder'] : [],
  };
}

export function buildWorkflowContract(model: GeneralPurposeAppModel): import('./general-purpose-code-generation-v1-types.js').WorkflowContract {
  const primary = model.workflows[0];
  return {
    readOnly: true,
    profile: model.profile,
    domain: model.domain,
    workflows: model.workflows,
    primaryWorkflowComplete: Boolean(primary && primary.steps.length >= 3),
    stateTransitions: primary?.steps.flatMap((step, i, arr) =>
      i < arr.length - 1 ? [`${step} → ${arr[i + 1]}`] : [],
    ) ?? [],
  };
}

export function buildRoleContract(model: GeneralPurposeAppModel): import('./general-purpose-code-generation-v1-types.js').RoleContract {
  return {
    readOnly: true,
    profile: model.profile,
    domain: model.domain,
    roles: model.roles,
    roleNavigationPresent: model.roles.length >= 2,
    permissionPlaceholdersPresent: model.permissions.length >= 2,
  };
}

export function buildDomainLogicReport(model: GeneralPurposeAppModel): import('./general-purpose-code-generation-v1-types.js').DomainLogicReportEntry {
  return {
    readOnly: true,
    profile: model.profile,
    domain: model.domain,
    logicIndicators: domainLogicForStrategy(model.strategy, model.domain),
    visibleInGeneratedApp: true,
  };
}
