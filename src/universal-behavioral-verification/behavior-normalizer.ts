/**
 * Universal Behavioral Verification Engine V1 — behavior normalization.
 *
 * Deterministic semantic keys (crud.create, workflow.transition, etc.).
 */

import type {
  BehaviorCategory,
  BehaviorVerificationStrategy,
  RawApprovedBehavior,
  UniversalBehaviorDescriptor,
} from './universal-behavior-types.js';
import {
  fingerprintBehavior,
  stableBehaviorId,
  UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE,
} from './universal-behavior-types.js';
import { collectBehaviorExtractionProvenance } from './approved-behavior-extractor.js';

const CATEGORY_PREFIX: Partial<Record<BehaviorCategory, string>> = {
  CRUD: 'crud',
  ACTION: 'action',
  WORKFLOW: 'workflow',
  RELATIONSHIP: 'relationship',
  RUNTIME_STATE: 'runtime',
  BUSINESS_RULE: 'rule',
  NAVIGATION: 'navigation',
  VALIDATION: 'validation',
  PERSISTENCE: 'persistence',
  FILTERING: 'filter',
  SORTING: 'sort',
  SEARCH: 'search',
  PAGINATION: 'pagination',
  SELECTION: 'selection',
  EXPORT: 'export',
  IMPORT: 'import',
  PREFERENCES: 'preferences',
  AUDIT: 'audit',
  NOTIFICATION: 'notification',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  FILE_OPERATION: 'file',
  SCHEDULING: 'scheduling',
  ANALYTICS: 'analytics',
  REPORTING: 'reporting',
  ERROR_HANDLING: 'error',
  RECOVERY: 'recovery',
  CUSTOM: 'custom',
};

export function normalizeBehaviorKey(raw: RawApprovedBehavior): string {
  const prefix = CATEGORY_PREFIX[raw.behaviorCategory] ?? 'custom';
  const label = raw.label.toLowerCase();

  if (raw.behaviorCategory === 'CRUD') {
    if (label.includes('create')) return 'crud.create';
    if (label.includes('read')) return 'crud.read';
    if (label.includes('update')) return 'crud.update';
    if (label.includes('delete')) return 'crud.delete';
    if (label.includes('list')) return 'crud.list';
    if (label.includes('search')) return 'crud.search';
    return 'crud.operation';
  }
  if (raw.behaviorCategory === 'WORKFLOW') {
    if (label.includes('approval')) return 'workflow.approval';
    return 'workflow.transition';
  }
  if (raw.behaviorCategory === 'RUNTIME_STATE') {
    if (label.includes('refresh')) return 'runtime.refresh';
    if (label.includes('sync')) return 'runtime.sync';
    return 'runtime.state';
  }
  if (raw.behaviorCategory === 'RELATIONSHIP') {
    if (label.includes('assign')) return 'relationship.assign';
    return 'relationship.link';
  }
  if (raw.behaviorCategory === 'EXPORT') {
    if (raw.capabilityKey?.includes('csv')) return 'export.csv';
    if (raw.capabilityKey?.includes('json')) return 'export.json';
    return 'export.data';
  }
  if (raw.behaviorCategory === 'PREFERENCES') {
    if (label.includes('reset')) return 'preferences.reset';
    return 'preferences.persist';
  }
  if (raw.behaviorCategory === 'NAVIGATION') return 'navigation.route';
  if (raw.behaviorCategory === 'PERSISTENCE') return 'persistence.commit';
  if (raw.behaviorCategory === 'VALIDATION') return 'validation.enforce';
  if (raw.behaviorCategory === 'RECOVERY') return 'recovery.retry';
  if (raw.behaviorCategory === 'FILTERING') return 'filter.apply';
  if (raw.behaviorCategory === 'SORTING') return 'sort.apply';
  if (raw.behaviorCategory === 'PAGINATION') return 'pagination.apply';
  if (raw.behaviorCategory === 'SELECTION') return 'selection.reconcile';
  if (raw.behaviorCategory === 'BUSINESS_RULE') return 'rule.evaluate';
  if (raw.behaviorCategory === 'AUDIT') return 'audit.record';
  if (raw.behaviorCategory === 'ACTION') {
    if (label.includes('export')) return 'action.export';
    if (label.includes('submit')) return 'action.submit';
    return 'action.execute';
  }

  return `${prefix}.${sanitizeKey(label)}`;
}

function sanitizeKey(label: string): string {
  return label.replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '').slice(0, 48) || 'behavior';
}

export function strategyForBehavior(
  raw: RawApprovedBehavior,
  normalizedKey: string,
): BehaviorVerificationStrategy {
  if (raw.supportClassification === 'NOT_REQUIRED') return 'deterministic_simulation';
  if (raw.behaviorCategory === 'NAVIGATION') return 'navigation_verification';
  if (raw.behaviorCategory === 'PERSISTENCE') return 'persistence_verification';
  if (raw.behaviorCategory === 'BUSINESS_RULE') return 'rule_verification';
  if (raw.behaviorCategory === 'WORKFLOW') return 'workflow_verification';
  if (raw.behaviorCategory === 'RUNTIME_STATE') return 'runtime_event_verification';
  if (raw.behaviorCategory === 'RELATIONSHIP') return 'state_verification';
  if (normalizedKey.startsWith('export.') || normalizedKey.startsWith('preferences.')) return 'runtime_execution';
  if (raw.behaviorCategory === 'CRUD' || raw.behaviorCategory === 'ACTION') return 'runtime_execution';
  if (raw.behaviorCategory === 'RECOVERY' || raw.behaviorCategory === 'ERROR_HANDLING') return 'behavioral_replay';
  return 'state_verification';
}

export function normalizeApprovedBehavior(raw: RawApprovedBehavior): UniversalBehaviorDescriptor {
  const normalizedKey = normalizeBehaviorKey(raw);
  const moduleId = raw.moduleId ?? 'global';
  const anchor = [
    moduleId,
    raw.entityId ?? '',
    raw.actionId ?? '',
    raw.workflowId ?? '',
    raw.relationshipId ?? '',
    raw.capabilityKey ?? '',
    raw.ruleId ?? '',
    raw.routePath ?? '',
    raw.sourceEnvelopePath,
  ].join('|');

  const descriptor: UniversalBehaviorDescriptor = {
    readOnly: true,
    behaviorId: stableBehaviorId(raw.behaviorCategory, normalizedKey, anchor),
    behaviorCategory: raw.behaviorCategory,
    normalizedKey,
    description: raw.label,
    sourceEnvelopePath: raw.sourceEnvelopePath,
    moduleIds: raw.moduleId ? [raw.moduleId] : [],
    entityIds: raw.entityId ? [raw.entityId] : [],
    actionIds: raw.actionId ? [raw.actionId] : [],
    workflowIds: raw.workflowId ? [raw.workflowId] : [],
    relationshipIds: raw.relationshipId ? [raw.relationshipId] : [],
    runtimeRequirements: deriveRuntimeRequirements(raw),
    expectedInputs: deriveExpectedInputs(raw),
    expectedOutputs: deriveExpectedOutputs(raw, normalizedKey),
    expectedStateChanges: deriveStateChanges(raw, normalizedKey),
    expectedPersistenceChanges: derivePersistenceChanges(raw, normalizedKey),
    expectedNavigation: raw.routePath ? [raw.routePath] : [],
    expectedEvents: deriveExpectedEvents(raw, normalizedKey),
    expectedBusinessRules: raw.ruleId ? [raw.ruleId] : [],
    verificationStrategy: strategyForBehavior(raw, normalizedKey),
    verificationEvidence: [],
    criticality: raw.criticality ?? 'OPTIONAL',
    provenance: [...collectBehaviorExtractionProvenance(), raw.sourceEnvelopePath],
    fingerprint: '',
    supportClassification: raw.supportClassification ?? 'EXECUTABLE',
  };

  return { ...descriptor, fingerprint: fingerprintBehavior(descriptor) };
}

export function normalizeApprovedBehaviors(raw: readonly RawApprovedBehavior[]): UniversalBehaviorDescriptor[] {
  return raw.map(normalizeApprovedBehavior).sort((a, b) => a.behaviorId.localeCompare(b.behaviorId));
}

function deriveRuntimeRequirements(raw: RawApprovedBehavior): string[] {
  const reqs: string[] = [];
  if (raw.behaviorCategory === 'CRUD' || raw.behaviorCategory === 'PERSISTENCE') reqs.push('crud-runtime');
  if (raw.behaviorCategory === 'ACTION') reqs.push('action-handler');
  if (raw.behaviorCategory === 'WORKFLOW') reqs.push('workflow-runtime');
  if (raw.behaviorCategory === 'RUNTIME_STATE') reqs.push('runtime-store');
  if (raw.behaviorCategory === 'BUSINESS_RULE') reqs.push('rule-evaluator');
  if (raw.capabilityKey) reqs.push(`capability:${raw.capabilityKey}`);
  return reqs;
}

function deriveExpectedInputs(raw: RawApprovedBehavior): string[] {
  if (raw.behaviorCategory === 'CRUD' && raw.label.includes('create')) return ['entity payload'];
  if (raw.behaviorCategory === 'VALIDATION') return ['invalid payload'];
  if (raw.behaviorCategory === 'RECOVERY') return ['failed operation'];
  return [];
}

function deriveExpectedOutputs(raw: RawApprovedBehavior, key: string): string[] {
  if (key.startsWith('crud.create')) return ['entity created', 'persistence succeeded'];
  if (key.startsWith('crud.read')) return ['correct retrieval'];
  if (key.startsWith('crud.update')) return ['mutation applied'];
  if (key.startsWith('crud.delete')) return ['deletion executed'];
  if (key.startsWith('workflow.')) return ['transition applied'];
  if (key.startsWith('export.')) return ['export content'];
  if (key.startsWith('preferences.')) return ['preference persisted'];
  if (raw.behaviorCategory === 'NAVIGATION') return ['route reachable'];
  return ['behavior executed'];
}

function deriveStateChanges(raw: RawApprovedBehavior, key: string): string[] {
  if (key.startsWith('runtime.refresh')) return ['state refreshed'];
  if (key.startsWith('selection.')) return ['selection updated'];
  return [];
}

function derivePersistenceChanges(raw: RawApprovedBehavior, key: string): string[] {
  if (key.startsWith('crud.') || key.startsWith('persistence.')) return ['record persisted'];
  if (key.startsWith('audit.')) return ['audit entry created'];
  return [];
}

function deriveExpectedEvents(raw: RawApprovedBehavior, key: string): string[] {
  if (key.startsWith('crud.')) return [`crud/${key.split('.')[1] ?? 'operation'}`];
  if (key.startsWith('workflow.')) return ['workflow/transition'];
  if (key.startsWith('action.')) return ['action/execute'];
  if (raw.behaviorCategory === 'RUNTIME_STATE') return ['runtime/query', 'runtime/mutation'];
  return [];
}
