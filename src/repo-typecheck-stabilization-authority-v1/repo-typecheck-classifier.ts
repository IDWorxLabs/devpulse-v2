/**
 * REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — diagnostic classification.
 */

import type { RepoTypecheckDiagnostic, RepoTypecheckFailureClass } from './repo-typecheck-types.js';

export function classifyTypeScriptDiagnostic(code: string, message: string): RepoTypecheckFailureClass {
  const lower = message.toLowerCase();

  switch (code) {
    case 'TS2307':
      return /cannot find module/i.test(message) ? 'MODULE_NOT_FOUND' : 'IMPORT_PATH_ERROR';
    case 'TS2305':
      return 'EXPORT_NOT_FOUND';
    case 'TS2300':
      return 'DUPLICATE_IDENTIFIER';
    case 'TS4104':
    case 'TS2540':
      return 'READONLY_MUTATION';
    case 'TS2322':
      return 'TYPE_ASSIGNMENT';
    case 'TS2339':
    case 'TS2532':
    case 'TS2533':
      return 'NULL_UNDEFINED';
    case 'TS2345':
    case 'TS2769':
      return 'FUNCTION_SIGNATURE';
    case 'TS2353':
      return 'OPTIONAL_PROPERTY';
    case 'TS2559':
    case 'TS2430':
      return 'INTERFACE_MISMATCH';
    case 'TS2314':
    case 'TS2315':
      return 'GENERIC_CONSTRAINT';
    case 'TS1064':
    case 'TS2355':
      return 'ASYNC_RETURN_TYPE';
    case 'TS7006':
    case 'TS7031':
      return 'MISSING_TYPE';
    case 'TS2678':
      return 'ENUM_MISMATCH';
    case 'TS6192':
      return 'UNUSED_IMPORT';
    case 'TS6133':
      return lower.includes('import') ? 'UNUSED_IMPORT' : 'UNUSED_VARIABLE';
    case 'TS5058':
    case 'TS5083':
      return 'CONFIGURATION_ERROR';
    case 'TS6305':
    case 'TS6310':
      return 'PROJECT_REFERENCE_ERROR';
    default:
      break;
  }

  if (/cannot find module|module not found/i.test(message)) return 'MODULE_NOT_FOUND';
  if (/has no exported member|is not exported/i.test(message)) return 'EXPORT_NOT_FOUND';
  if (/duplicate identifier/i.test(message)) return 'DUPLICATE_IDENTIFIER';
  if (/readonly|read-only property/i.test(message)) return 'READONLY_MUTATION';
  if (/unused/i.test(message) && /import/i.test(message)) return 'UNUSED_IMPORT';
  if (/unused/i.test(message)) return 'UNUSED_VARIABLE';
  if (/tsconfig|project reference/i.test(message)) return 'CONFIGURATION_ERROR';

  return 'UNKNOWN_TYPESCRIPT_FAILURE';
}

export function classifyDiagnostics(diagnostics: RepoTypecheckDiagnostic[]): RepoTypecheckFailureClass[] {
  const seen = new Set<RepoTypecheckFailureClass>();
  const classes: RepoTypecheckFailureClass[] = [];
  for (const diagnostic of diagnostics) {
    if (seen.has(diagnostic.failureClass)) continue;
    seen.add(diagnostic.failureClass);
    classes.push(diagnostic.failureClass);
  }
  return classes;
}

export function extractRootSymbol(message: string, failureClass: RepoTypecheckFailureClass): string | null {
  if (failureClass === 'EXPORT_NOT_FOUND') {
    const match = message.match(/exported member ['"]([^'"]+)['"]/i);
    return match?.[1] ?? null;
  }
  if (failureClass === 'MODULE_NOT_FOUND' || failureClass === 'IMPORT_PATH_ERROR') {
    const match = message.match(/module ['"]([^'"]+)['"]/i);
    return match?.[1] ?? null;
  }
  if (failureClass === 'DUPLICATE_IDENTIFIER' || failureClass === 'UNUSED_IMPORT' || failureClass === 'UNUSED_VARIABLE') {
    const match = message.match(/['"]([^'"]+)['"]/);
    return match?.[1] ?? null;
  }
  return null;
}

export function isUnsafeFailureClass(failureClass: RepoTypecheckFailureClass): boolean {
  return failureClass === 'UNKNOWN_TYPESCRIPT_FAILURE';
}

export function isRepairableFailureClass(failureClass: RepoTypecheckFailureClass): boolean {
  return [
    'IMPORT_PATH_ERROR',
    'MODULE_NOT_FOUND',
    'EXPORT_NOT_FOUND',
    'DUPLICATE_IDENTIFIER',
    'READONLY_MUTATION',
    'UNUSED_IMPORT',
    'UNUSED_VARIABLE',
  ].includes(failureClass);
}
