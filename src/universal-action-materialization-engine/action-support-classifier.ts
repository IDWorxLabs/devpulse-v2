/**
 * Universal Action Materialization Engine V1 — support classification.
 */

import type { NormalizedAction } from './action-normalization-engine.js';
import type {
  UniversalActionExecutionStrategy,
  UniversalActionSemanticType,
  UniversalActionSupportClassification,
} from './universal-action-types.js';

const CRUD_SEMANTICS = new Set<UniversalActionSemanticType>([
  'CREATE', 'READ', 'UPDATE', 'DELETE', 'SEARCH', 'FILTER', 'SORT', 'PAGINATE', 'REFRESH',
]);

const STATE_SEMANTICS = new Set<UniversalActionSemanticType>([
  'SELECT', 'DESELECT', 'RESET', 'ENABLE', 'DISABLE', 'REORDER', 'UNDO', 'REDO',
]);

const PERSISTENCE_SEMANTICS = new Set<UniversalActionSemanticType>([
  'SAVE', 'SUBMIT', 'ARCHIVE', 'RESTORE', 'APPROVE', 'REJECT', 'COMPLETE', 'REOPEN',
  'ACTIVATE', 'DEACTIVATE', 'ASSIGN', 'UNASSIGN', 'DUPLICATE', 'MOVE',
]);

const NAVIGATION_SEMANTICS = new Set<UniversalActionSemanticType>([
  'NAVIGATE', 'OPEN', 'CLOSE', 'CANCEL',
]);

const CALCULATION_SEMANTICS = new Set<UniversalActionSemanticType>([
  'CALCULATE', 'RECALCULATE', 'GENERATE',
]);

const IMPORT_EXPORT_SEMANTICS = new Set<UniversalActionSemanticType>([
  'IMPORT', 'EXPORT', 'DOWNLOAD', 'UPLOAD', 'PRINT',
]);

const BLOCKED_SCHEDULING_VERBS = ['schedule', 'reschedule', 'book slot', 'calendar'];
const BLOCKED_AUTH_VERBS = ['authenticate', 'login', 'sign in', 'authorize'];
const BLOCKED_NOTIFICATION_VERBS = ['notify', 'send notification', 'email alert', 'push alert'];
const BLOCKED_WORKFLOW_VERBS = ['workflow', 'orchestrate', 'multi-step'];
const BLOCKED_FILE_VERBS = ['upload file', 'attach file', 'file storage'];
const BLOCKED_EXTERNAL_VERBS = ['sync external', 'api integration', 'webhook'];

export interface ActionSupportClassificationInput {
  readonly normalized: NormalizedAction;
  readonly crudBacked: boolean;
  readonly approvedRoutes: readonly string[];
}

export interface ActionSupportClassificationResult {
  readonly classification: UniversalActionSupportClassification;
  readonly executionStrategy: UniversalActionExecutionStrategy;
  readonly blockedReason?: string;
}

export function classifyActionSupport(input: ActionSupportClassificationInput): ActionSupportClassificationResult {
  const { normalized, crudBacked } = input;
  const lower = normalized.raw.label.toLowerCase();
  const semantic = normalized.semanticType;

  if (semantic === 'INFORMATIONAL') {
    return {
      classification: 'NOT_EXECUTABLE_INFORMATIONAL',
      executionStrategy: 'informational-only',
    };
  }

  if (semantic === 'CUSTOM_COMMAND' && normalized.confidence === 'low') {
    return {
      classification: 'INVALID_ACTION_CONTRACT',
      executionStrategy: 'extension-point-adapter',
      blockedReason: 'Action contract lacks recognizable semantic verb',
    };
  }

  for (const verb of BLOCKED_SCHEDULING_VERBS) {
    if (lower.includes(verb)) {
      return blocked('blocked_by_scheduling_capability', 'Scheduling capability not available in B2');
    }
  }
  for (const verb of BLOCKED_AUTH_VERBS) {
    if (lower.includes(verb)) {
      return blocked('blocked_by_authentication_capability', 'Authentication capability not available in B2');
    }
  }
  for (const verb of BLOCKED_NOTIFICATION_VERBS) {
    if (lower.includes(verb)) {
      return blocked('blocked_by_external_integration_capability', 'Notification delivery not available in B2');
    }
  }
  for (const verb of BLOCKED_WORKFLOW_VERBS) {
    if (lower.includes(verb)) {
      return blocked('blocked_by_workflow_capability', 'Workflow orchestration not available in B2');
    }
  }
  for (const verb of BLOCKED_FILE_VERBS) {
    if (lower.includes(verb)) {
      return blocked('blocked_by_file_capability', 'File storage capability not available in B2');
    }
  }
  for (const verb of BLOCKED_EXTERNAL_VERBS) {
    if (lower.includes(verb)) {
      return blocked('blocked_by_external_integration_capability', 'External integration not available in B2');
    }
  }

  if (semantic === 'CONFIRM' && lower.includes('delete')) {
    return { classification: 'STATE_BACKED', executionStrategy: 'state-adapter' };
  }

  if (CRUD_SEMANTICS.has(semantic)) {
    if (crudBacked) {
      return { classification: 'CRUD_BACKED', executionStrategy: 'crud-adapter' };
    }
    return { classification: 'FULLY_SUPPORTED', executionStrategy: 'persistence-adapter' };
  }

  if (STATE_SEMANTICS.has(semantic)) {
    return { classification: 'STATE_BACKED', executionStrategy: 'state-adapter' };
  }

  if (PERSISTENCE_SEMANTICS.has(semantic)) {
    if (crudBacked) {
      return { classification: 'PERSISTENCE_BACKED', executionStrategy: 'persistence-adapter' };
    }
    return { classification: 'EXTENSION_POINT_REQUIRED', executionStrategy: 'extension-point-adapter', blockedReason: 'Persistence target requires entity module' };
  }

  if (NAVIGATION_SEMANTICS.has(semantic)) {
    return { classification: 'NAVIGATION_BACKED', executionStrategy: 'navigation-adapter' };
  }

  if (CALCULATION_SEMANTICS.has(semantic)) {
    return { classification: 'FULLY_SUPPORTED', executionStrategy: 'calculation-adapter' };
  }

  if (IMPORT_EXPORT_SEMANTICS.has(semantic)) {
    if (semantic === 'UPLOAD' || semantic === 'PRINT') {
      return blocked('blocked_by_file_capability', `${semantic} requires file/report capability not in B2`);
    }
    return { classification: 'FULLY_SUPPORTED', executionStrategy: 'import-export-adapter' };
  }

  if (semantic === 'SERVICE_COMMAND') {
    if (normalized.matchedVerb === 'schedule' || normalized.matchedVerb === 'reschedule') {
      return blocked('blocked_by_scheduling_capability', 'Scheduling requires future capability');
    }
    return { classification: 'SERVICE_COMMAND_BACKED', executionStrategy: 'service-command-adapter' };
  }

  if (semantic === 'RETRY') {
    return { classification: 'STATE_BACKED', executionStrategy: 'state-adapter' };
  }

  return {
    classification: 'EXTENSION_POINT_REQUIRED',
    executionStrategy: 'extension-point-adapter',
    blockedReason: `No adapter for semantic type ${semantic}`,
  };
}

function blocked(reason: string, message: string): ActionSupportClassificationResult {
  return {
    classification: 'BLOCKED_BY_FUTURE_CAPABILITY',
    executionStrategy: 'extension-point-adapter',
    blockedReason: `${reason}: ${message}`,
  };
}
