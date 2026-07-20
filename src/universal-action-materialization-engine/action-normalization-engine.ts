/**
 * Universal Action Materialization Engine V1 — action normalization (verb-driven, domain-agnostic).
 */

import type { RawApprovedAction, UniversalActionSemanticType } from './universal-action-types.js';

export interface NormalizedAction {
  readonly raw: RawApprovedAction;
  readonly semanticType: UniversalActionSemanticType;
  readonly confidence: 'high' | 'medium' | 'low';
  readonly matchedVerb: string;
}

const VERB_PATTERNS: ReadonlyArray<{ verbs: readonly string[]; semantic: UniversalActionSemanticType }> = [
  { verbs: ['create', 'add', 'register', 'new', 'insert'], semantic: 'CREATE' },
  { verbs: ['update', 'edit', 'modify', 'change'], semantic: 'UPDATE' },
  { verbs: ['delete', 'remove', 'destroy'], semantic: 'DELETE' },
  { verbs: ['view', 'read', 'show', 'display', 'details'], semantic: 'READ' },
  { verbs: ['save', 'persist'], semantic: 'SAVE' },
  { verbs: ['submit'], semantic: 'SUBMIT' },
  { verbs: ['cancel'], semantic: 'CANCEL' },
  { verbs: ['confirm'], semantic: 'CONFIRM' },
  { verbs: ['reset', 'clear'], semantic: 'RESET' },
  { verbs: ['refresh', 'reload'], semantic: 'REFRESH' },
  { verbs: ['select', 'choose'], semantic: 'SELECT' },
  { verbs: ['deselect', 'unselect'], semantic: 'DESELECT' },
  { verbs: ['enable'], semantic: 'ENABLE' },
  { verbs: ['disable'], semantic: 'DISABLE' },
  { verbs: ['activate'], semantic: 'ACTIVATE' },
  { verbs: ['deactivate'], semantic: 'DEACTIVATE' },
  { verbs: ['archive'], semantic: 'ARCHIVE' },
  { verbs: ['restore', 'unarchive'], semantic: 'RESTORE' },
  { verbs: ['duplicate', 'copy', 'clone'], semantic: 'DUPLICATE' },
  { verbs: ['assign', 'allocate'], semantic: 'ASSIGN' },
  { verbs: ['unassign', 'deallocate'], semantic: 'UNASSIGN' },
  { verbs: ['move', 'transfer'], semantic: 'MOVE' },
  { verbs: ['reorder', 'sort order'], semantic: 'REORDER' },
  { verbs: ['approve', 'accept'], semantic: 'APPROVE' },
  { verbs: ['reject', 'deny'], semantic: 'REJECT' },
  { verbs: ['complete', 'finish', 'mark complete', 'mark done'], semantic: 'COMPLETE' },
  { verbs: ['reopen', 're-open'], semantic: 'REOPEN' },
  { verbs: ['search', 'find', 'lookup'], semantic: 'SEARCH' },
  { verbs: ['filter'], semantic: 'FILTER' },
  { verbs: ['sort'], semantic: 'SORT' },
  { verbs: ['paginate', 'page'], semantic: 'PAGINATE' },
  { verbs: ['import'], semantic: 'IMPORT' },
  { verbs: ['export', 'download'], semantic: 'EXPORT' },
  { verbs: ['upload'], semantic: 'UPLOAD' },
  { verbs: ['calculate', 'compute'], semantic: 'CALCULATE' },
  { verbs: ['recalculate', 'recompute'], semantic: 'RECALCULATE' },
  { verbs: ['generate'], semantic: 'GENERATE' },
  { verbs: ['print'], semantic: 'PRINT' },
  { verbs: ['navigate', 'go to'], semantic: 'NAVIGATE' },
  { verbs: ['open'], semantic: 'OPEN' },
  { verbs: ['close'], semantic: 'CLOSE' },
  { verbs: ['retry', 'try again'], semantic: 'RETRY' },
  { verbs: ['undo'], semantic: 'UNDO' },
  { verbs: ['redo'], semantic: 'REDO' },
  { verbs: ['schedule', 'reschedule', 'book slot'], semantic: 'SERVICE_COMMAND' },
  { verbs: ['notify', 'send notification', 'email alert'], semantic: 'SERVICE_COMMAND' },
  { verbs: ['authenticate', 'login', 'sign in'], semantic: 'SERVICE_COMMAND' },
  { verbs: ['workflow', 'orchestrate'], semantic: 'SERVICE_COMMAND' },
];

/** Deterministic normalization from approved action metadata and verbs. */
export function normalizeApprovedAction(raw: RawApprovedAction): NormalizedAction {
  const lower = raw.label.toLowerCase();

  for (const pattern of VERB_PATTERNS) {
    for (const verb of pattern.verbs) {
      if (lower.includes(verb)) {
        return {
          raw,
          semanticType: pattern.semantic,
          confidence: verb.length > 4 ? 'high' : 'medium',
          matchedVerb: verb,
        };
      }
    }
  }

  if (/^(view|about|help|info|overview|summary)/i.test(raw.label)) {
    return { raw, semanticType: 'INFORMATIONAL', confidence: 'high', matchedVerb: 'informational' };
  }

  return { raw, semanticType: 'CUSTOM_COMMAND', confidence: 'low', matchedVerb: 'custom' };
}

export function normalizeApprovedActions(rawActions: readonly RawApprovedAction[]): NormalizedAction[] {
  return rawActions.map(normalizeApprovedAction);
}
