/**
 * Universal Action Materialization Engine V1 — action descriptor builder.
 */

import type { NormalizedAction } from './action-normalization-engine.js';
import type { ActionSupportClassificationResult } from './action-support-classifier.js';
import type {
  UniversalActionConfirmationPolicy,
  UniversalActionControlKind,
  UniversalActionDescriptor,
  UniversalActionMaterializationInput,
  UniversalActionNavigationEffect,
  UniversalActionPersistenceEffect,
  UniversalActionPrecondition,
  UniversalActionSemanticType,
  UniversalActionStateEffect,
} from './universal-action-types.js';
import { stableActionId } from './universal-action-types.js';

const DESTRUCTIVE_SEMANTICS = new Set<UniversalActionSemanticType>([
  'DELETE', 'ARCHIVE', 'REJECT',
]);

export function buildActionDescriptor(
  normalized: NormalizedAction,
  support: ActionSupportClassificationResult,
  input: UniversalActionMaterializationInput,
): UniversalActionDescriptor {
  const { moduleId, moduleDisplayName, moduleRoute, buildId, promptHash, contractId } = input;
  const semantic = normalized.semanticType;
  const actionId = stableActionId([
    moduleId,
    semantic,
    normalized.raw.label,
    normalized.raw.sourceEnvelopePath,
    buildId,
  ]);

  const preconditions = buildPreconditions(semantic, support);
  const confirmationPolicy = buildConfirmationPolicy(semantic, normalized.raw.label);
  const stateEffects = buildStateEffects(semantic);
  const persistenceEffects = buildPersistenceEffects(semantic, support);
  const navigationEffects = buildNavigationEffects(semantic, moduleRoute, input.approvedRoutes);

  return {
    actionId,
    label: normalized.raw.label,
    description: `${normalized.raw.label} — ${moduleDisplayName}`,
    semanticType: semantic,
    targetType: semantic === 'NAVIGATE' || semantic === 'OPEN' ? 'NAVIGATION' : 'ENTITY',
    targetId: moduleId,
    moduleId,
    entityId: moduleId,
    sourceEnvelopePath: normalized.raw.sourceEnvelopePath,
    inputSchema: { fields: buildInputFields(semantic) },
    preconditions,
    validationRules: buildValidationRules(semantic),
    confirmationPolicy,
    executionStrategy: support.executionStrategy,
    stateEffects,
    persistenceEffects,
    navigationEffects,
    feedbackPolicy: {
      successMessage: `${normalized.raw.label} completed`,
      errorMessage: `${normalized.raw.label} failed`,
      pendingMessage: `${normalized.raw.label}…`,
    },
    undoPolicy: {
      supported: semantic === 'DELETE' || semantic === 'UNDO',
      kind: semantic === 'DELETE' ? 'delete-undo' : semantic === 'UNDO' ? 'state-rollback' : undefined,
    },
    verificationRequirements: [
      'control-reachable',
      'handler-invokes-adapter',
      'feedback-matches-outcome',
    ],
    provenance: {
      sourceEnvelopePath: normalized.raw.sourceEnvelopePath,
      sourceLabel: normalized.raw.label,
      buildId,
      promptHash,
    },
    supportClassification: support.classification,
    controlKind: resolveControlKind(semantic, support),
    blockedReason: support.blockedReason,
  };
}

function buildPreconditions(
  semantic: UniversalActionSemanticType,
  support: ActionSupportClassificationResult,
): UniversalActionPrecondition[] {
  const pre: UniversalActionPrecondition[] = [
    { id: 'data-loaded', kind: 'data-loaded', message: 'Data must be loaded before executing this action' },
  ];
  if (['DELETE', 'UPDATE', 'ARCHIVE', 'ASSIGN', 'APPROVE', 'REJECT', 'COMPLETE'].includes(semantic)) {
    pre.push({ id: 'target-exists', kind: 'target-exists', message: 'A target record must exist' });
  }
  if (['DELETE', 'ARCHIVE', 'EXPORT', 'ASSIGN', 'APPROVE'].includes(semantic)) {
    pre.push({ id: 'selection-required', kind: 'selection-required', message: 'Select at least one item' });
  }
  if (support.classification === 'BLOCKED_BY_FUTURE_CAPABILITY') {
    pre.push({ id: 'capability-available', kind: 'capability-available', message: 'Required capability is not available' });
  }
  return pre;
}

function buildConfirmationPolicy(semantic: UniversalActionSemanticType, rawLabel: string): UniversalActionConfirmationPolicy {
  const lower = rawLabel.toLowerCase();
  const destructive =
    DESTRUCTIVE_SEMANTICS.has(semantic) ||
    lower.includes('delete') ||
    lower.includes('remove') ||
    lower.includes('archive');
  return {
    required: destructive || lower.includes('confirm'),
    message: destructive ? `Confirm: ${rawLabel}?` : `Proceed with ${rawLabel}?`,
    destructive,
  };
}

function buildStateEffects(semantic: UniversalActionSemanticType): UniversalActionStateEffect[] {
  switch (semantic) {
    case 'SELECT':
      return [{ kind: 'update-selection', field: 'selectedIds' }];
    case 'DESELECT':
      return [{ kind: 'clear-selection' }];
    case 'RESET':
      return [{ kind: 'reset-form' }, { kind: 'mark-dirty', field: 'dirty', value: 'false' }];
    case 'REFRESH':
      return [{ kind: 'update-loading', field: 'loading' }];
    case 'ENABLE':
      return [{ kind: 'set-field', field: 'enabled', value: 'true' }];
    case 'DISABLE':
      return [{ kind: 'set-field', field: 'enabled', value: 'false' }];
    case 'REORDER':
      return [{ kind: 'reorder-collection' }];
    default:
      return [];
  }
}

function buildPersistenceEffects(
  semantic: UniversalActionSemanticType,
  support: ActionSupportClassificationResult,
): UniversalActionPersistenceEffect[] {
  if (support.executionStrategy === 'crud-adapter') {
    const map: Partial<Record<UniversalActionSemanticType, UniversalActionPersistenceEffect>> = {
      CREATE: { kind: 'create' },
      UPDATE: { kind: 'update' },
      DELETE: { kind: 'delete' },
    };
    return map[semantic] ? [map[semantic]!] : [];
  }
  if (['ARCHIVE', 'RESTORE', 'APPROVE', 'REJECT', 'COMPLETE', 'REOPEN', 'ACTIVATE', 'DEACTIVATE'].includes(semantic)) {
    return [{ kind: 'update', operation: semantic.toLowerCase() }];
  }
  if (semantic === 'DUPLICATE') {
    return [{ kind: 'create', operation: 'duplicate' }];
  }
  if (semantic === 'ASSIGN' || semantic === 'UNASSIGN') {
    return [{ kind: 'update', operation: semantic.toLowerCase() }];
  }
  return [];
}

function buildNavigationEffects(
  semantic: UniversalActionSemanticType,
  moduleRoute: string,
  approvedRoutes: readonly string[],
): UniversalActionNavigationEffect[] {
  if (semantic === 'NAVIGATE' || semantic === 'OPEN') {
    const route = approvedRoutes.includes(moduleRoute) ? moduleRoute : approvedRoutes[0] ?? moduleRoute;
    return [{ route, mode: 'push' }];
  }
  if (semantic === 'CLOSE' || semantic === 'CANCEL') {
    return [{ route: approvedRoutes[0] ?? '/', mode: 'back' }];
  }
  return [];
}

function buildInputFields(semantic: UniversalActionSemanticType) {
  if (['CREATE', 'UPDATE', 'SAVE', 'SUBMIT'].includes(semantic)) {
    return [{ name: 'label', required: true, type: 'string' as const }];
  }
  if (['ASSIGN', 'UNASSIGN'].includes(semantic)) {
    return [{ name: 'assignee', required: true, type: 'string' as const }];
  }
  if (['APPROVE', 'REJECT'].includes(semantic)) {
    return [{ name: 'status', required: true, type: 'enum' as const, enumValues: [semantic.toLowerCase()] }];
  }
  return [];
}

function buildValidationRules(semantic: UniversalActionSemanticType) {
  if (['CREATE', 'UPDATE', 'SAVE'].includes(semantic)) {
    return [{ field: 'label', rule: 'required' as const, message: 'Label is required' }];
  }
  return [];
}

function resolveControlKind(
  semantic: UniversalActionSemanticType,
  support: ActionSupportClassificationResult,
): UniversalActionControlKind {
  if (support.classification === 'BLOCKED_BY_FUTURE_CAPABILITY') return 'secondary-button';
  if (DESTRUCTIVE_SEMANTICS.has(semantic) || semantic === 'DELETE') return 'destructive-button';
  if (semantic === 'SUBMIT' || semantic === 'SAVE' || semantic === 'CREATE') return 'form-submit';
  if (semantic === 'NAVIGATE' || semantic === 'OPEN') return 'navigation-link';
  if (semantic === 'RETRY') return 'retry-control';
  if (['DELETE', 'ARCHIVE'].includes(semantic)) return 'bulk-action';
  return 'secondary-button';
}

export function buildActionDescriptors(
  normalizedActions: readonly NormalizedAction[],
  classifications: readonly ActionSupportClassificationResult[],
  input: UniversalActionMaterializationInput,
): UniversalActionDescriptor[] {
  return normalizedActions.map((n, i) => buildActionDescriptor(n, classifications[i]!, input));
}
