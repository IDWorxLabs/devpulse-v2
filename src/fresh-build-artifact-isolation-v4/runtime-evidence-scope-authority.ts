/**
 * Runtime Evidence Scope Authority.
 *
 * Creates a runtime evidence scope for every build — a deterministic, generic identity for "the
 * evidence that belongs to this exact request/build/project", independent of product domain.
 *
 * - NEW_BUILD: allowed evidence namespaces include only current request/build/project evidence;
 *   blocked namespaces cover every previous build/project/session evidence source, and no
 *   unscoped evidence lookup is allowed.
 * - CONTINUE_EXISTING_PROJECT: the current project's own (inherited) evidence is explicitly
 *   allowed under a distinct, justified namespace — never silently merged with "current build"
 *   evidence — while previous-build/session/unscoped evidence from anywhere else stays blocked.
 */

import {
  type EvidenceNamespaceId,
  type PurgeAction,
  type RuntimeEvidenceScope,
  type RuntimeEvidenceScopeInput,
  type StaleEvidenceDetection,
} from './fresh-build-artifact-isolation-types.js';

const NEW_BUILD_ALLOWED_NAMESPACES: EvidenceNamespaceId[] = [
  'CURRENT_REQUEST_EVIDENCE',
  'CURRENT_BUILD_EVIDENCE',
  'CURRENT_PROJECT_EVIDENCE',
];

const NEW_BUILD_BLOCKED_NAMESPACES: EvidenceNamespaceId[] = [
  'PREVIOUS_BUILD_EVIDENCE',
  'PREVIOUS_PROJECT_EVIDENCE',
  'PREVIOUS_SESSION_EVIDENCE',
  'UNSCOPED_EVIDENCE',
];

const CONTINUE_ALLOWED_NAMESPACES: EvidenceNamespaceId[] = [
  'CURRENT_REQUEST_EVIDENCE',
  'CURRENT_BUILD_EVIDENCE',
  'CURRENT_PROJECT_EVIDENCE',
  'INHERITED_PROJECT_EVIDENCE',
];

const CONTINUE_BLOCKED_NAMESPACES: EvidenceNamespaceId[] = [
  'PREVIOUS_BUILD_EVIDENCE',
  'PREVIOUS_SESSION_EVIDENCE',
  'UNSCOPED_EVIDENCE',
];

function scopeIdFor(part: string, buildId: string): string {
  return `${part}::${buildId}`;
}

/** Deterministic (same input -> same scope ids); no crypto needed since buildId is already unique per build. */
export function buildRuntimeEvidenceScope(
  input: RuntimeEvidenceScopeInput,
  purgeActionsPerformed: PurgeAction[] = [],
  staleEvidenceDetections: StaleEvidenceDetection[] = [],
): RuntimeEvidenceScope {
  const isContinuation = input.decision === 'CONTINUE_EXISTING_PROJECT';
  return {
    readOnly: true,
    requestId: input.requestId,
    buildId: input.buildId,
    projectId: input.projectId,
    decision: input.decision,
    promptHash: input.promptHash,
    workspaceScopeId: scopeIdFor('workspace-scope', input.buildId),
    runtimeScopeId: scopeIdFor('runtime-scope', input.buildId),
    previewEvidenceScopeId: scopeIdFor('preview-scope', input.buildId),
    faithfulnessEvidenceScopeId: scopeIdFor('faithfulness-scope', input.buildId),
    materializationEvidenceScopeId: scopeIdFor('materialization-scope', input.buildId),
    allowedEvidenceNamespaces: isContinuation ? CONTINUE_ALLOWED_NAMESPACES : NEW_BUILD_ALLOWED_NAMESPACES,
    blockedEvidenceNamespaces: isContinuation ? CONTINUE_BLOCKED_NAMESPACES : NEW_BUILD_BLOCKED_NAMESPACES,
    purgeActionsPerformed,
    staleEvidenceDetections,
  };
}

/** Returns a new scope with staleness detections merged in — scopes are immutable snapshots. */
export function withStaleEvidenceDetections(
  scope: RuntimeEvidenceScope,
  detections: StaleEvidenceDetection[],
): RuntimeEvidenceScope {
  return { ...scope, staleEvidenceDetections: [...scope.staleEvidenceDetections, ...detections] };
}

export function isEvidenceNamespaceAllowed(scope: RuntimeEvidenceScope, namespace: EvidenceNamespaceId): boolean {
  return scope.allowedEvidenceNamespaces.includes(namespace) && !scope.blockedEvidenceNamespaces.includes(namespace);
}
