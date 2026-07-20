/**
 * Universal CRUD Generation Engine V1 — behavior verification (static analysis).
 */

import type {
  UniversalCrudBehaviorVerificationResult,
  UniversalCrudEntityDescriptor,
} from './universal-crud-types.js';
import { moduleIdToPascalCase } from './universal-crud-types.js';

export interface CrudGeneratedSources {
  readonly entityId: string;
  readonly repository: string;
  readonly service: string;
  readonly validation: string;
  readonly runtimeState: string;
  readonly component: string;
}

function check(name: string, source: string, patterns: RegExp[]): { id: string; passed: boolean; detail: string } {
  const missing = patterns.filter((p) => !p.test(source)).map((p) => p.source);
  return {
    id: name,
    passed: missing.length === 0,
    detail: missing.length === 0 ? 'ok' : `missing patterns: ${missing.join(', ')}`,
  };
}

/** Verifies generated CRUD artifacts expose full create/read/update/delete behavior wiring. */
export function verifyUniversalCrudBehavior(
  descriptor: UniversalCrudEntityDescriptor,
  sources: CrudGeneratedSources,
): UniversalCrudBehaviorVerificationResult {
  const pascal = moduleIdToPascalCase(descriptor.entityId);
  const checks = [
    check('repository-create', sources.repository, [/create/, /function create/]),
    check('repository-update', sources.repository, [/update/, /function update/]),
    check('repository-delete', sources.repository, [/delete/, /function delete/]),
    check('repository-list', sources.repository, [/list/, /function list/]),
    check('repository-search', sources.repository, [/search/]),
    check('repository-count', sources.repository, [/count/]),
    check('repository-batch', sources.repository, [/batchCreate/, /batchUpdate/, /batchDelete/]),
    check('service-crud', sources.service, [
      new RegExp(`create${pascal}Record`),
      new RegExp(`update${pascal}Record`),
      new RegExp(`delete${pascal}Record`),
      new RegExp(`list${pascal}Records`),
    ]),
    check('service-not-empty-placeholder', sources.service, [
      new RegExp(`list${pascal}Records\\(`),
      /CrudListResult/,
    ]),
    check('validation-executes', sources.validation, [/validate/, /valid:/, /errors/]),
    check('runtime-state', sources.runtimeState, [/loading/, /error/, /refresh/, /create/, /update/, /confirmDelete/]),
    check('ui-handlers', sources.component, [/onClick/, /onSubmit/, /onChange/, /data-interaction-control/]),
    check('ui-crud-actions', sources.component, [/Create/, /Edit/, /Delete/, /Refresh/, /Search/]),
    check('persistence-provider', sources.repository, [/universal-crud-runtime/]),
  ];

  return {
    readOnly: true,
    entityId: descriptor.entityId,
    passed: checks.every((c) => c.passed),
    checks,
  };
}

/** Engineering Intelligence gap hints when CRUD verification fails — domain-agnostic. */
export function diagnoseUniversalCrudGenerationGaps(
  verification: UniversalCrudBehaviorVerificationResult,
): readonly string[] {
  const gaps: string[] = [];
  for (const check of verification.checks) {
    if (check.passed) continue;
    if (check.id.includes('repository')) gaps.push('missing_repository');
    else if (check.id.includes('service')) gaps.push('missing_service');
    else if (check.id.includes('validation')) gaps.push('missing_validation');
    else if (check.id.includes('runtime')) gaps.push('missing_runtime_state');
    else if (check.id.includes('ui')) gaps.push('missing_handlers');
    else if (check.id.includes('persistence')) gaps.push('missing_persistence');
    else gaps.push('missing_mutation');
  }
  return [...new Set(gaps)];
}

export function verifyCrudMutationChain(sources: CrudGeneratedSources): boolean {
  return (
    /create/.test(sources.service) &&
    /update/.test(sources.service) &&
    /delete/.test(sources.service) &&
    /onSubmit/.test(sources.component) &&
    /onClick/.test(sources.component) &&
    !/^export function list\w+Records\(\): \w+\[\] {\s*return \[\];\s*}/m.test(sources.service)
  );
}
