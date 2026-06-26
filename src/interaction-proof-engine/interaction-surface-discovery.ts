/**
 * Interaction Proof Engine — interaction surface discovery.
 */

import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';
import type { InteractionClassification, InteractionSurface } from './interaction-proof-types.js';

let interactionCounter = 0;

export function resetInteractionSurfaceDiscoveryForTests(): void {
  interactionCounter = 0;
}

function nextInteractionId(prefix: string): string {
  interactionCounter += 1;
  return `ix-${prefix}-${interactionCounter}`;
}

interface SurfaceTemplate {
  elementType: string;
  label: string;
  accessibleName: string;
  role: string;
  route: string;
  featureSliceId: string;
  eventType: string;
  expectedHandler: string;
  classification: InteractionClassification;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

const EXPENSE_SURFACES: SurfaceTemplate[] = [
  {
    elementType: 'BUTTON',
    label: 'Save expense',
    accessibleName: 'Save expense',
    role: 'button',
    route: '/expenses',
    featureSliceId: 'expense-create',
    eventType: 'click',
    expectedHandler: 'saveExpenseHandler',
    classification: 'REQUIRED_INTERACTION',
    riskLevel: 'HIGH',
  },
  {
    elementType: 'BUTTON',
    label: 'Edit expense',
    accessibleName: 'Edit expense',
    role: 'button',
    route: '/expenses',
    featureSliceId: 'expense-edit',
    eventType: 'click',
    expectedHandler: 'editExpenseHandler',
    classification: 'REQUIRED_INTERACTION',
    riskLevel: 'MEDIUM',
  },
  {
    elementType: 'BUTTON',
    label: 'Delete expense',
    accessibleName: 'Delete expense',
    role: 'button',
    route: '/expenses',
    featureSliceId: 'expense-delete',
    eventType: 'click',
    expectedHandler: 'deleteExpenseHandler',
    classification: 'REQUIRED_INTERACTION',
    riskLevel: 'MEDIUM',
  },
  {
    elementType: 'BUTTON',
    label: 'Export report',
    accessibleName: 'Export report',
    role: 'button',
    route: '/reports',
    featureSliceId: 'expense-export',
    eventType: 'click',
    expectedHandler: 'exportReportHandler',
    classification: 'REQUIRED_INTERACTION',
    riskLevel: 'HIGH',
  },
  {
    elementType: 'INPUT',
    label: 'Amount',
    accessibleName: 'Expense amount',
    role: 'textbox',
    route: '/expenses',
    featureSliceId: 'expense-create',
    eventType: 'input',
    expectedHandler: 'amountInputHandler',
    classification: 'REQUIRED_INTERACTION',
    riskLevel: 'MEDIUM',
  },
];

const LISA_SURFACES: SurfaceTemplate[] = [
  {
    elementType: 'BUTTON',
    label: 'Emergency phrase',
    accessibleName: 'Emergency phrase',
    role: 'button',
    route: '/communication',
    featureSliceId: 'emergency-speech',
    eventType: 'click',
    expectedHandler: 'triggerEmergencySpeechHandler',
    classification: 'REQUIRED_INTERACTION',
    riskLevel: 'HIGH',
  },
  {
    elementType: 'BUTTON',
    label: 'Speak phrase',
    accessibleName: 'Speak selected phrase',
    role: 'button',
    route: '/communication',
    featureSliceId: 'text-to-speech',
    eventType: 'click',
    expectedHandler: 'speakPhraseHandler',
    classification: 'REQUIRED_INTERACTION',
    riskLevel: 'HIGH',
  },
  {
    elementType: 'BUTTON',
    label: 'Blink select',
    accessibleName: 'Blink selection target',
    role: 'button',
    route: '/communication',
    featureSliceId: 'blink-input-engine',
    eventType: 'click',
    expectedHandler: 'blinkSelectHandler',
    classification: 'REQUIRED_INTERACTION',
    riskLevel: 'HIGH',
  },
  {
    elementType: 'SWITCH',
    label: 'Text size',
    accessibleName: 'Text size setting',
    role: 'switch',
    route: '/settings',
    featureSliceId: 'accessibility-settings',
    eventType: 'toggle',
    expectedHandler: 'settingsToggleHandler',
    classification: 'REQUIRED_INTERACTION',
    riskLevel: 'MEDIUM',
  },
];

export function discoverInteractionSurfaces(input: {
  rawPrompt: string;
  productIntelligenceModel?: ProductIntelligenceModel;
  incrementalBuild?: IncrementalBuildPipelineResult;
  behaviorSimulation?: BehaviorSimulationPipelineResult;
  virtualUserSimulation?: VirtualUserPipelineResult;
  simulateUnknownInteraction?: boolean;
  sliceIdFilter?: string | null;
  sliceNameFilter?: string | null;
}): InteractionSurface[] {
  const isLisa =
    promptMentionsLisaOrAccessibility(input.rawPrompt) ||
    input.productIntelligenceModel?.product.productType === 'ASSISTIVE_COMMUNICATION';
  const isExpense =
    /expense|finance|tracker/i.test(input.rawPrompt) ||
    input.productIntelligenceModel?.product.productType === 'EXPENSE_TRACKER';

  const templates = isLisa ? LISA_SURFACES : isExpense ? EXPENSE_SURFACES : [
    {
      elementType: 'BUTTON',
      label: 'Primary action',
      accessibleName: 'Primary action',
      role: 'button',
      route: '/',
      featureSliceId: 'primary-feature',
      eventType: 'click',
      expectedHandler: 'primaryActionHandler',
      classification: 'REQUIRED_INTERACTION' as const,
      riskLevel: 'MEDIUM' as const,
    },
  ];

  const surfaces: InteractionSurface[] = templates.map((t) => ({
    readOnly: true,
    interactionId: nextInteractionId(t.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    elementType: t.elementType,
    label: t.label,
    accessibleName: t.accessibleName,
    role: t.role,
    selectorStrategy: `[data-testid="${t.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"]`,
    route: t.route,
    featureSliceId: t.featureSliceId,
    eventType: t.eventType,
    expectedHandler: t.expectedHandler,
    classification: t.classification,
    riskLevel: t.riskLevel,
  }));

  if (input.simulateUnknownInteraction) {
    surfaces.push({
      readOnly: true,
      interactionId: nextInteractionId('unknown-icon'),
      elementType: 'BUTTON',
      label: 'Unknown icon',
      accessibleName: '',
      role: 'button',
      selectorStrategy: '[data-testid="unknown-icon"]',
      route: '/',
      featureSliceId: 'unknown',
      eventType: 'click',
      expectedHandler: '',
      classification: 'UNKNOWN_INTERACTION',
      riskLevel: 'HIGH',
    });
  }

  if (input.sliceIdFilter) {
    const norm = input.sliceIdFilter.toLowerCase();
    return surfaces.filter(
      (s) =>
        s.featureSliceId === input.sliceIdFilter ||
        s.featureSliceId.includes(norm.replace(/^slice-/, '')),
    );
  }

  if (input.sliceNameFilter) {
    const norm = input.sliceNameFilter.toLowerCase();
    return surfaces.filter(
      (s) =>
        norm.includes(s.featureSliceId.replace(/-/g, ' ')) ||
        s.featureSliceId.split('-').some((part) => part.length > 3 && norm.includes(part)),
    );
  }

  return surfaces;
}
