/**
 * Interaction Proof Engine — interaction intent mapping.
 */

import type { InteractionIntentMapping, InteractionSurface } from './interaction-proof-types.js';

const INTENT_MAP: Record<string, { purpose: string; dataEffect: string; uiEffect: string }> = {
  'Save expense': {
    purpose: 'Submit expense form and create expense record',
    dataEffect: 'Expense created',
    uiEffect: 'Expense list updates',
  },
  'Emergency phrase': {
    purpose: 'Trigger emergency speech output and append to history',
    dataEffect: 'Emergency message added to history',
    uiEffect: 'Confirmation visible',
  },
  'Export report': {
    purpose: 'Generate and download expense export',
    dataEffect: 'Export payload generated',
    uiEffect: 'Export completed state appears',
  },
  'Edit expense': {
    purpose: 'Edit existing expense record',
    dataEffect: 'Expense edited',
    uiEffect: 'Updated expense visible in list',
  },
  'Delete expense': {
    purpose: 'Delete expense record',
    dataEffect: 'Expense deleted',
    uiEffect: 'Expense removed from list',
  },
  'Speak phrase': {
    purpose: 'Trigger speech output for selected phrase',
    dataEffect: 'Phrase spoken',
    uiEffect: 'Speech confirmation visible',
  },
  'Blink select': {
    purpose: 'Select item using blink input',
    dataEffect: 'Selection registered',
    uiEffect: 'Selected item highlighted',
  },
  'Text size': {
    purpose: 'Change accessibility text size preference',
    dataEffect: 'Settings persisted',
    uiEffect: 'UI presentation updated',
  },
  Amount: {
    purpose: 'Enter expense amount',
    dataEffect: 'Amount captured',
    uiEffect: 'Form field updated',
  },
  'Primary action': {
    purpose: 'Execute primary workflow',
    dataEffect: 'Primary action completed',
    uiEffect: 'Primary confirmation visible',
  },
};

export function mapInteractionIntents(surfaces: readonly InteractionSurface[]): InteractionIntentMapping[] {
  return surfaces.map((surface) => {
    const mapped = INTENT_MAP[surface.label];
    const isUnknown = surface.classification === 'UNKNOWN_INTERACTION';
    return {
      readOnly: true,
      interactionId: surface.interactionId,
      purpose: mapped?.purpose ?? (isUnknown ? '' : `Execute ${surface.label}`),
      behaviorScenarioIds: [],
      capabilityIds: [],
      mapped: Boolean(mapped) && !isUnknown,
      unmappedReason: isUnknown ? 'No requirement, behavior, journey, or intent mapping found' : mapped ? null : 'UNMAPPED_INTERACTION_INTENT',
    };
  });
}
