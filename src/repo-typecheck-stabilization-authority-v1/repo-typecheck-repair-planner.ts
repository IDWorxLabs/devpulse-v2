/**
 * REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — root-cause grouping and repair planning.
 */

import type {
  RepoTypecheckDiagnostic,
  RepoTypecheckRepairPlan,
  RepoTypecheckRootCauseGroup,
} from './repo-typecheck-types.js';
import {
  extractRootSymbol,
  isRepairableFailureClass,
  isUnsafeFailureClass,
} from './repo-typecheck-classifier.js';

export function groupDiagnosticsByRootCause(
  diagnostics: RepoTypecheckDiagnostic[],
): RepoTypecheckRootCauseGroup[] {
  const groups = new Map<string, RepoTypecheckRootCauseGroup>();

  for (const diagnostic of diagnostics) {
    const rootSymbol = extractRootSymbol(diagnostic.message, diagnostic.failureClass);
    const groupKey = `${diagnostic.failureClass}::${rootSymbol ?? diagnostic.file}::${diagnostic.code}`;
    const existing = groups.get(groupKey);
    if (existing) {
      existing.diagnostics.push(diagnostic);
      existing.downstreamCount += 1;
      continue;
    }
    groups.set(groupKey, {
      readOnly: true,
      groupId: groupKey,
      failureClass: diagnostic.failureClass,
      primaryFile: diagnostic.file,
      primaryLine: diagnostic.line,
      primaryCode: diagnostic.code,
      primaryMessage: diagnostic.message,
      diagnostics: [diagnostic],
      downstreamCount: 1,
      rootSymbol,
      safe: isRepairableFailureClass(diagnostic.failureClass) && !isUnsafeFailureClass(diagnostic.failureClass),
    });
  }

  return [...groups.values()].sort((a, b) => b.downstreamCount - a.downstreamCount);
}

export function selectPrimaryRootCause(
  groups: RepoTypecheckRootCauseGroup[],
): RepoTypecheckRootCauseGroup | null {
  const repairable = groups.filter((group) => group.safe);
  if (repairable.length === 0) {
    return groups[0] ?? null;
  }
  return repairable.sort((a, b) => b.downstreamCount - a.downstreamCount)[0] ?? null;
}

export function planRepoTypecheckRepair(input: {
  diagnostics: RepoTypecheckDiagnostic[];
  projectRootDir: string;
}): RepoTypecheckRepairPlan | null {
  const groups = groupDiagnosticsByRootCause(input.diagnostics);
  const rootCause = selectPrimaryRootCause(groups);
  if (!rootCause) return null;

  if (!rootCause.safe || isUnsafeFailureClass(rootCause.failureClass)) {
    return {
      readOnly: true,
      rootCause,
      description: `No safe automated repair for ${rootCause.failureClass}`,
      targetFiles: [rootCause.primaryFile],
      safe: false,
      blockedReason: 'Unsafe or unsupported failure class for automated repair',
    };
  }

  const targetFiles = [...new Set(rootCause.diagnostics.map((d) => d.file))].filter((f) => f !== 'unknown');
  return {
    readOnly: true,
    rootCause,
    description: describeRepair(rootCause),
    targetFiles,
    safe: true,
    blockedReason: null,
  };
}

function describeRepair(rootCause: RepoTypecheckRootCauseGroup): string {
  switch (rootCause.failureClass) {
    case 'IMPORT_PATH_ERROR':
    case 'MODULE_NOT_FOUND':
      return `Correct import path for module ${rootCause.rootSymbol ?? 'reference'}`;
    case 'EXPORT_NOT_FOUND':
      return `Add or re-export symbol ${rootCause.rootSymbol ?? 'member'} from provider module`;
    case 'DUPLICATE_IDENTIFIER':
      return `Remove duplicate identifier ${rootCause.rootSymbol ?? 'declaration'}`;
    case 'READONLY_MUTATION':
      return 'Correct readonly vs mutable type mismatch';
    case 'UNUSED_IMPORT':
      return `Remove unused import ${rootCause.rootSymbol ?? ''}`.trim();
    case 'UNUSED_VARIABLE':
      return `Remove or use unused variable ${rootCause.rootSymbol ?? ''}`.trim();
    default:
      return `Repair ${rootCause.failureClass} at ${rootCause.primaryFile}:${rootCause.primaryLine}`;
  }
}

export function countDownstreamForExport(
  diagnostics: RepoTypecheckDiagnostic[],
  exportSymbol: string,
): number {
  return diagnostics.filter(
    (d) =>
      d.failureClass === 'EXPORT_NOT_FOUND' &&
      d.message.includes(`'${exportSymbol}'`),
  ).length;
}
