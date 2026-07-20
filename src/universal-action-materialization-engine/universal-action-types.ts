/**
 * Universal Action Materialization Engine V1 — domain-agnostic types.
 */

import type { CbgaCanonicalContractEvidence } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import type { ApprovedModulePlan } from '../contract-bound-generation-authority-v4/approved-module-plan.js';

export const UNIVERSAL_ACTION_MATERIALIZATION_ENGINE_VERSION = '1.0.0' as const;
export const UNIVERSAL_ACTION_MATERIALIZATION_ENGINE_SOURCE = 'UNIVERSAL_ACTION_MATERIALIZATION_ENGINE_V1' as const;

/** Semantic action types — action-type-driven, never application-type-driven. */
export type UniversalActionSemanticType =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'SAVE'
  | 'SUBMIT'
  | 'CANCEL'
  | 'CONFIRM'
  | 'RESET'
  | 'REFRESH'
  | 'SELECT'
  | 'DESELECT'
  | 'ENABLE'
  | 'DISABLE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'DUPLICATE'
  | 'ASSIGN'
  | 'UNASSIGN'
  | 'MOVE'
  | 'REORDER'
  | 'APPROVE'
  | 'REJECT'
  | 'COMPLETE'
  | 'REOPEN'
  | 'SEARCH'
  | 'FILTER'
  | 'SORT'
  | 'PAGINATE'
  | 'IMPORT'
  | 'EXPORT'
  | 'DOWNLOAD'
  | 'UPLOAD'
  | 'CALCULATE'
  | 'RECALCULATE'
  | 'GENERATE'
  | 'PRINT'
  | 'NAVIGATE'
  | 'OPEN'
  | 'CLOSE'
  | 'RETRY'
  | 'UNDO'
  | 'REDO'
  | 'SERVICE_COMMAND'
  | 'CUSTOM_COMMAND'
  | 'INFORMATIONAL';

export type UniversalActionSupportClassification =
  | 'FULLY_SUPPORTED'
  | 'CRUD_BACKED'
  | 'STATE_BACKED'
  | 'PERSISTENCE_BACKED'
  | 'NAVIGATION_BACKED'
  | 'SERVICE_COMMAND_BACKED'
  | 'EXTENSION_POINT_REQUIRED'
  | 'BLOCKED_BY_FUTURE_CAPABILITY'
  | 'INVALID_ACTION_CONTRACT'
  | 'NOT_EXECUTABLE_INFORMATIONAL';

export type UniversalActionVerificationClassification =
  | 'BEHAVIORALLY_VERIFIED'
  | 'STRUCTURALLY_PRESENT_ONLY'
  | 'BLOCKED_BY_CAPABILITY'
  | 'INVALID'
  | 'NOT_RUN'
  | 'FAILED';

export type UniversalActionTargetType = 'ENTITY' | 'MODULE' | 'COLLECTION' | 'FORM' | 'SELECTION' | 'NAVIGATION' | 'SERVICE';

export type UniversalActionControlKind =
  | 'primary-button'
  | 'secondary-button'
  | 'destructive-button'
  | 'icon-button'
  | 'menu-item'
  | 'toolbar-action'
  | 'form-submit'
  | 'confirmation-control'
  | 'toggle'
  | 'navigation-link'
  | 'retry-control'
  | 'bulk-action';

export type UniversalActionExecutionStrategy =
  | 'crud-adapter'
  | 'state-adapter'
  | 'persistence-adapter'
  | 'navigation-adapter'
  | 'calculation-adapter'
  | 'import-export-adapter'
  | 'service-command-adapter'
  | 'extension-point-adapter'
  | 'informational-only';

export interface UniversalActionInputField {
  readonly name: string;
  readonly required: boolean;
  readonly type: 'string' | 'number' | 'boolean' | 'enum';
  readonly enumValues?: readonly string[];
}

export interface UniversalActionInputSchema {
  readonly fields: readonly UniversalActionInputField[];
}

export interface UniversalActionPrecondition {
  readonly id: string;
  readonly kind:
    | 'target-exists'
    | 'selection-required'
    | 'valid-input-required'
    | 'data-loaded'
    | 'non-empty-collection'
    | 'confirmation-accepted'
    | 'capability-available';
  readonly message: string;
}

export interface UniversalActionValidationRule {
  readonly field: string;
  readonly rule: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'enum';
  readonly value?: string | number;
  readonly message: string;
}

export interface UniversalActionConfirmationPolicy {
  readonly required: boolean;
  readonly message: string;
  readonly destructive: boolean;
}

export interface UniversalActionStateEffect {
  readonly kind: string;
  readonly field?: string;
  readonly value?: string;
}

export interface UniversalActionPersistenceEffect {
  readonly kind: 'create' | 'update' | 'delete' | 'batch' | 'archive' | 'restore' | 'command';
  readonly operation?: string;
}

export interface UniversalActionNavigationEffect {
  readonly route: string;
  readonly mode: 'push' | 'replace' | 'panel-open' | 'panel-close' | 'back';
}

export interface UniversalActionFeedbackPolicy {
  readonly successMessage: string;
  readonly errorMessage: string;
  readonly pendingMessage: string;
}

export interface UniversalActionUndoPolicy {
  readonly supported: boolean;
  readonly kind?: 'delete-undo' | 'state-rollback' | 'update-rollback';
}

export interface UniversalActionProvenance {
  readonly sourceEnvelopePath: string;
  readonly sourceLabel: string;
  readonly buildId: string;
  readonly promptHash: string;
}

/** Raw action extracted from envelope — before normalization. */
export interface RawApprovedAction {
  readonly label: string;
  readonly sourceEnvelopePath: string;
  readonly moduleId: string;
  readonly contractId: string;
}

/** Domain-neutral materialized action descriptor. */
export interface UniversalActionDescriptor {
  readonly actionId: string;
  readonly label: string;
  readonly description: string;
  readonly semanticType: UniversalActionSemanticType;
  readonly targetType: UniversalActionTargetType;
  readonly targetId: string;
  readonly moduleId: string;
  readonly entityId: string;
  readonly sourceEnvelopePath: string;
  readonly inputSchema: UniversalActionInputSchema;
  readonly preconditions: readonly UniversalActionPrecondition[];
  readonly validationRules: readonly UniversalActionValidationRule[];
  readonly confirmationPolicy: UniversalActionConfirmationPolicy;
  readonly executionStrategy: UniversalActionExecutionStrategy;
  readonly stateEffects: readonly UniversalActionStateEffect[];
  readonly persistenceEffects: readonly UniversalActionPersistenceEffect[];
  readonly navigationEffects: readonly UniversalActionNavigationEffect[];
  readonly feedbackPolicy: UniversalActionFeedbackPolicy;
  readonly undoPolicy: UniversalActionUndoPolicy;
  readonly verificationRequirements: readonly string[];
  readonly provenance: UniversalActionProvenance;
  readonly supportClassification: UniversalActionSupportClassification;
  readonly controlKind: UniversalActionControlKind;
  readonly blockedReason?: string;
}

export interface UniversalActionMaterializationInput {
  readonly moduleId: string;
  readonly moduleDisplayName: string;
  readonly moduleRoute: string;
  readonly appTitle: string;
  readonly contractId: string;
  readonly crudBacked: boolean;
  readonly approvedRoutes: readonly string[];
  readonly canonicalProductContract: CbgaCanonicalContractEvidence;
  readonly approvedModulePlan: ApprovedModulePlan | null;
  readonly buildId: string;
  readonly promptHash: string;
}

export interface UniversalActionBehaviorVerificationResult {
  readonly readOnly: true;
  readonly actionId: string;
  readonly classification: UniversalActionVerificationClassification;
  readonly passed: boolean;
  readonly checks: readonly { readonly id: string; readonly passed: boolean; readonly detail: string }[];
}

export interface UniversalActionMaterializationReport {
  readonly readOnly: true;
  readonly engineVersion: typeof UNIVERSAL_ACTION_MATERIALIZATION_ENGINE_VERSION;
  readonly moduleId: string;
  readonly totalApprovedActions: number;
  readonly fullyMaterializedActions: number;
  readonly crudBackedActions: number;
  readonly stateBackedActions: number;
  readonly persistenceBackedActions: number;
  readonly navigationBackedActions: number;
  readonly serviceCommandBackedActions: number;
  readonly informationalActions: number;
  readonly blockedActions: number;
  readonly invalidActions: number;
  readonly structurallyPresentOnly: number;
  readonly behaviorallyVerifiedActions: number;
  readonly failedActions: number;
  readonly behavioralCoveragePercent: number;
  readonly descriptors: readonly UniversalActionDescriptor[];
  readonly verifications: readonly UniversalActionBehaviorVerificationResult[];
}

export function escActionString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`');
}

export function stableActionId(parts: readonly string[]): string {
  const raw = parts.join('|').toLowerCase().replace(/[^a-z0-9|_-]+/g, '-');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return `action-${hash.toString(16).padStart(8, '0')}`;
}
