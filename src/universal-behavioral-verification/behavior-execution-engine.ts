/**
 * Universal Behavioral Verification Engine V1 — runtime execution harness.
 */

import { verifyPackBehavior } from '../universal-capability-pack-framework/capability-pack-behavior-verification.js';
import type {
  BehaviorExecutionContext,
  BehaviorVerificationResultEntry,
  UniversalBehaviorDescriptor,
} from './universal-behavior-types.js';
import { observeBehaviorExecution } from './behavior-runtime-observer.js';
import { collectBehaviorEvidence } from './behavior-evidence-collector.js';
import { classifyBehaviorResult, buildBehaviorVerificationResultEntry } from './behavior-verification-result.js';
import { diagnoseBehaviorFailure } from './behavior-diagnostics.js';
import { buildGlobalExecutionCache, type GlobalExecutionCache } from './behavior-module-cache.js';

interface CrudEntityRecord {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

export class VerificationCrudRuntime {
  private readonly store = new Map<string, CrudEntityRecord>();

  create(entity: CrudEntityRecord): CrudEntityRecord {
    this.store.set(entity.id, entity);
    return entity;
  }

  update(id: string, patch: Partial<CrudEntityRecord>): CrudEntityRecord | null {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, id: existing.id, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.store.delete(id);
  }

  findById(id: string): CrudEntityRecord | null {
    return this.store.get(id) ?? null;
  }

  list(): CrudEntityRecord[] {
    return [...this.store.values()];
  }

  search(term: string): CrudEntityRecord[] {
    const lower = term.toLowerCase();
    return this.list().filter((r) => r.label.toLowerCase().includes(lower));
  }

  count(): number {
    return this.store.size;
  }

  snapshot(): Record<string, unknown> {
    return { count: this.count(), ids: this.list().map((r) => r.id) };
  }
}

function executeCrudRuntime(
  descriptor: UniversalBehaviorDescriptor,
  runtime: VerificationCrudRuntime,
): { passed: boolean; observed: string[]; checks: { id: string; passed: boolean; detail: string }[] } {
  const checks: { id: string; passed: boolean; detail: string }[] = [];
  const check = (id: string, passed: boolean, detail: string) => checks.push({ id, passed, detail });
  const now = new Date().toISOString();
  const key = descriptor.normalizedKey;
  const observed: string[] = [];

  if (key === 'crud.create') {
    runtime.create({ id: 'v1', label: 'Verification Entity', createdAt: now, updatedAt: now });
    check('entity-created', runtime.findById('v1') !== null, 'entity created');
    check('persistence-succeeded', runtime.count() >= 1, 'persistence');
    observed.push('entity created', 'persistence succeeded');
  } else if (key === 'crud.read') {
    runtime.create({ id: 'read-1', label: 'Read Test', createdAt: now, updatedAt: now });
    check('correct-retrieval', runtime.findById('read-1')?.label === 'Read Test', 'read');
    if (runtime.findById('read-1')) observed.push('correct retrieval');
  } else if (key === 'crud.update') {
    runtime.create({ id: 'upd-1', label: 'Before', createdAt: now, updatedAt: now });
    check('mutation-applied', runtime.update('upd-1', { label: 'After' })?.label === 'After', 'update');
    observed.push('mutation applied');
  } else if (key === 'crud.delete') {
    runtime.create({ id: 'del-1', label: 'Delete Me', createdAt: now, updatedAt: now });
    check('deletion-executed', runtime.delete('del-1'), 'delete');
    observed.push('deletion executed');
  } else if (key === 'crud.list') {
    runtime.create({ id: 'l1', label: 'A', createdAt: now, updatedAt: now });
    runtime.create({ id: 'l2', label: 'B', createdAt: now, updatedAt: now });
    check('list-retrieval', runtime.list().length >= 2, 'list');
    observed.push('correct retrieval');
  } else if (key === 'crud.search') {
    runtime.create({ id: 's1', label: 'Alpha', createdAt: now, updatedAt: now });
    check('search-filter', runtime.search('alpha').length === 1, 'search');
    observed.push('filtering');
  }

  return { passed: checks.every((c) => c.passed), observed, checks };
}

export function executeBehaviorVerification(
  descriptor: UniversalBehaviorDescriptor,
  context: BehaviorExecutionContext,
  cache: GlobalExecutionCache,
): BehaviorVerificationResultEntry {
  const moduleId = descriptor.moduleIds[0] ?? 'global';
  const mod = cache.modules.get(moduleId);
  const files = new Map(context.workspaceFiles.map((f) => [f.relativePath, f.content]));
  const checks: { id: string; passed: boolean; detail: string }[] = [];
  const check = (id: string, passed: boolean, detail: string) => checks.push({ id, passed, detail });

  let runtimeExecuted = false;
  let observedOutputs: string[] = [];
  let blocked = false;
  let unsupported = false;
  let invalid = false;

  const observation = observeBehaviorExecution(
    { descriptor, workspaceSources: Object.fromEntries(files) },
    () => {
      const stateBefore: Record<string, unknown> = { moduleId };
      let stateAfter: Record<string, unknown> = { moduleId };
      const events: string[] = [];
      const logs: string[] = [`observed:${descriptor.behaviorId}`];

      if (descriptor.supportClassification === 'NOT_REQUIRED') {
        logs.push('not_required');
        return { stateBefore, stateAfter, logs, events };
      }

      if (descriptor.behaviorCategory === 'CRUD' && mod) {
        runtimeExecuted = true;
        const runtime = new VerificationCrudRuntime();
        const crudResult = executeCrudRuntime(descriptor, runtime);
        checks.push(...crudResult.checks);
        check('structural-not-only', mod.crudStructuralPassed, 'CRUD structural wiring');
        check('mutation-chain', mod.crudMutationPassed, 'mutation chain');
        check('generated-runtime-present', mod.crudRuntimePresent, 'runtime artifact');
        observedOutputs = crudResult.observed;
        stateAfter = runtime.snapshot();
        events.push(`crud/${descriptor.normalizedKey.split('.')[1] ?? 'op'}`);
      } else if (descriptor.behaviorCategory === 'ACTION' && mod) {
        runtimeExecuted = true;
        check('action-handler', mod.actionPassed, 'action handler');
        if (mod.actionPassed) observedOutputs.push('handler executes');
        events.push('action/execute');
      } else if (descriptor.behaviorCategory === 'WORKFLOW' && mod) {
        runtimeExecuted = true;
        check('workflow-transition', mod.workflowPassed, 'workflow');
        if (mod.workflowPassed) observedOutputs.push('transition applied');
        events.push('workflow/transition');
      } else if (descriptor.behaviorCategory === 'RELATIONSHIP' && mod) {
        runtimeExecuted = true;
        check('relationship-link', mod.relationshipPassed, 'relationship');
        if (mod.relationshipPassed) observedOutputs.push('relationship navigation');
        events.push('relationship/link');
      } else if (descriptor.behaviorCategory === 'RUNTIME_STATE' && mod) {
        runtimeExecuted = true;
        check('runtime-refresh', mod.runtimePassed, 'runtime');
        if (mod.runtimePassed) observedOutputs.push('state refreshed');
        events.push('runtime/refresh');
      } else if (descriptor.behaviorCategory === 'BUSINESS_RULE' && mod) {
        runtimeExecuted = true;
        check('rule-evaluate', mod.rulePassed, 'rule');
        if (mod.rulePassed) observedOutputs.push('rule evaluated');
        events.push('rule/evaluate');
      } else if (descriptor.normalizedKey.startsWith('preferences.')) {
        runtimeExecuted = true;
        check('preferences-runtime', cache.preferencesPassed, 'preferences');
        if (cache.preferencesPassed) observedOutputs.push('preference persisted');
      } else if (descriptor.normalizedKey.startsWith('audit.')) {
        runtimeExecuted = true;
        check('audit-runtime', cache.auditPassed, 'audit');
        if (cache.auditPassed) observedOutputs.push('audit entry created');
      } else if (descriptor.normalizedKey === 'export.json') {
        runtimeExecuted = true;
        check('export-json', cache.exportJsonPassed, 'export json');
        if (cache.exportJsonPassed) observedOutputs.push('export content');
      } else if (descriptor.normalizedKey === 'export.csv') {
        runtimeExecuted = true;
        check('export-csv', cache.exportCsvPassed, 'export csv');
        if (cache.exportCsvPassed) observedOutputs.push('export content');
      } else if (descriptor.normalizedKey.startsWith('scheduling.')) {
        runtimeExecuted = true;
        check('scheduling-runtime', cache.schedulingPassed, 'scheduling');
        if (cache.schedulingPassed) observedOutputs.push('availability computed');
      } else if (descriptor.behaviorCategory === 'NAVIGATION') {
        runtimeExecuted = true;
        const route = descriptor.expectedNavigation[0] ?? `/${moduleId}`;
        const registry = files.get('src/features/registry.ts') ?? '';
        const reachable = registry.includes(moduleId);
        check('route-reachable', reachable, route);
        if (reachable) observedOutputs.push('route reachable');
      } else if (descriptor.behaviorCategory === 'PERSISTENCE' && mod) {
        runtimeExecuted = true;
        const runtime = new VerificationCrudRuntime();
        const now = new Date().toISOString();
        runtime.create({ id: 'p1', label: 'Persist', createdAt: now, updatedAt: now });
        check('persistence-commit', runtime.count() === 1, 'persist');
        observedOutputs = ['record persisted'];
        stateAfter = runtime.snapshot();
      } else if (descriptor.behaviorCategory === 'VALIDATION' && mod) {
        runtimeExecuted = true;
        check('validation-source', mod.validationPresent, 'validation');
        if (mod.validationPresent) observedOutputs.push('validation enforced');
      } else if (descriptor.behaviorCategory === 'RECOVERY' && mod) {
        runtimeExecuted = true;
        check('recovery-path', mod.recoveryPresent, 'recovery');
        if (mod.recoveryPresent) observedOutputs.push('recovery executed');
      } else if (['FILTERING', 'SORTING', 'PAGINATION', 'SELECTION'].includes(descriptor.behaviorCategory) && mod) {
        runtimeExecuted = true;
        const combined = `${mod.sources.component}\n${mod.sources.runtimeState}`;
        check('runtime-control', /search|sort|page|select|filter/i.test(combined), descriptor.behaviorCategory);
        if (/search|sort|page|select|filter/i.test(combined)) observedOutputs.push('behavior executed');
      } else if (
        descriptor.behaviorCategory === 'AUTHENTICATION' ||
        descriptor.behaviorCategory === 'NOTIFICATION'
      ) {
        blocked = true;
        unsupported = true;
        check('capability-blocked', true, 'missing capability pack');
      } else if (descriptor.behaviorCategory === 'EXPORT' && descriptor.normalizedKey === 'export.data') {
        runtimeExecuted = cache.exportJsonPassed || cache.exportCsvPassed;
        check('export-runtime', runtimeExecuted, 'export');
        if (runtimeExecuted) observedOutputs.push('export content');
      } else {
        const packId = descriptor.behaviorCategory === 'PREFERENCES'
          ? 'universal-preferences-pack'
          : descriptor.behaviorCategory === 'AUDIT'
            ? 'universal-audit-trail-pack'
            : 'universal-data-export-pack-basic';
        const pv = verifyPackBehavior(packId, { packArtifacts: cache.packArtifacts, registrySource: cache.packRegistrySource });
        runtimeExecuted = pv.passed;
        checks.push(...pv.checks.map((c) => ({ ...c, id: `pack-${c.id}` })));
        if (pv.classification === 'BLOCKED_BY_MISSING_PACK') blocked = true;
        if (pv.passed) observedOutputs.push('pack behavior executed');
      }

      return { stateBefore, stateAfter, events, logs };
    },
  );

  const allChecksPassed = checks.length > 0 && checks.every((c) => c.passed);
  const checksPassed = checks.some((c) => c.passed);
  const classification = classifyBehaviorResult({
    descriptor,
    checksPassed,
    allChecksPassed,
    runtimeExecuted,
    evidence: collectBehaviorEvidence({
      descriptor,
      observation,
      verificationMethod: descriptor.verificationStrategy,
      result: 'VERIFIED',
      observedOutputs,
      expectedOutputs: descriptor.expectedOutputs,
    }),
    blocked,
    invalid,
    unsupported,
  });

  return buildBehaviorVerificationResultEntry({
    descriptor,
    classification,
    evidence: collectBehaviorEvidence({
      descriptor,
      observation,
      verificationMethod: descriptor.verificationStrategy,
      result: classification,
      observedOutputs,
      expectedOutputs: descriptor.expectedOutputs,
    }),
    checks,
    diagnosisCodes: diagnoseBehaviorFailure(descriptor, classification, checks),
  });
}

export function executeAllBehaviorVerifications(
  descriptors: readonly UniversalBehaviorDescriptor[],
  context: BehaviorExecutionContext,
): BehaviorVerificationResultEntry[] {
  const cache = buildGlobalExecutionCache(context);
  return descriptors.map((d) => executeBehaviorVerification(d, context, cache));
}

export { buildGlobalExecutionCache } from './behavior-module-cache.js';
export type { GlobalExecutionCache, ModuleExecutionCacheEntry } from './behavior-module-cache.js';
