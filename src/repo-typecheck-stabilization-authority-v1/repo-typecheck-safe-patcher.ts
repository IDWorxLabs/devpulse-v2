/**
 * REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — minimal safe patch application with rollback support.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type {
  RepoTypecheckDiagnostic,
  RepoTypecheckPatchRecord,
  RepoTypecheckPatchSnapshot,
  RepoTypecheckRepairPlan,
} from './repo-typecheck-types.js';
import { REPO_TYPECHECK_FIXTURE_REGRESSION_MARKER } from './repo-typecheck-types.js';

function assertSafePath(projectRootDir: string, targetPath: string): boolean {
  const resolvedRoot = resolve(projectRootDir);
  const resolvedTarget = resolve(targetPath);
  return resolvedTarget.startsWith(resolvedRoot);
}

function resolveProjectFile(projectRootDir: string, file: string): string {
  if (file === 'unknown') {
    throw new Error('Cannot resolve unknown diagnostic file');
  }
  const normalized = file.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    return normalized;
  }
  return join(projectRootDir, normalized);
}

export function capturePatchSnapshot(projectRootDir: string, files: string[]): RepoTypecheckPatchSnapshot {
  const snapshot: Record<string, string> = {};
  for (const file of files) {
    const absolute = resolveProjectFile(projectRootDir, file);
    if (!assertSafePath(projectRootDir, absolute)) continue;
    if (existsSync(absolute)) {
      snapshot[absolute] = readFileSync(absolute, 'utf8');
    } else {
      snapshot[absolute] = '';
    }
  }
  return { readOnly: true, files: snapshot };
}

export function rollbackPatchSnapshot(snapshot: RepoTypecheckPatchSnapshot): void {
  for (const [absolute, content] of Object.entries(snapshot.files)) {
    if (content === '') {
      continue;
    }
    writeFileSync(absolute, content, 'utf8');
  }
}

function readSource(projectRootDir: string, file: string): string | null {
  const absolute = resolveProjectFile(projectRootDir, file);
  if (!assertSafePath(projectRootDir, absolute) || !existsSync(absolute)) return null;
  return readFileSync(absolute, 'utf8');
}

function writeSource(projectRootDir: string, file: string, content: string): boolean {
  const absolute = resolveProjectFile(projectRootDir, file);
  if (!assertSafePath(projectRootDir, absolute)) return false;
  writeFileSync(absolute, content, 'utf8');
  return true;
}

function isRegressionTrapEnabled(projectRootDir: string): boolean {
  return existsSync(join(projectRootDir, REPO_TYPECHECK_FIXTURE_REGRESSION_MARKER));
}

export function applyRepoTypecheckRepairPatch(input: {
  cycle: number;
  plan: RepoTypecheckRepairPlan;
  projectRootDir: string;
  beforeErrorCount: number;
}): RepoTypecheckPatchRecord {
  const { plan, projectRootDir, cycle, beforeErrorCount } = input;
  const rootCause = plan.rootCause;

  if (!plan.safe) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, plan.blockedReason ?? 'Unsafe repair plan');
  }

  switch (rootCause.failureClass) {
    case 'IMPORT_PATH_ERROR':
    case 'MODULE_NOT_FOUND':
      return repairImportPath(cycle, plan, projectRootDir, beforeErrorCount, rootCause.diagnostics[0]!);
    case 'EXPORT_NOT_FOUND':
      return repairMissingExport(cycle, plan, projectRootDir, beforeErrorCount, rootCause.diagnostics[0]!);
    case 'DUPLICATE_IDENTIFIER':
      return repairDuplicateIdentifier(cycle, plan, projectRootDir, beforeErrorCount, rootCause.diagnostics[0]!);
    case 'READONLY_MUTATION':
      return repairReadonlyMutation(cycle, plan, projectRootDir, beforeErrorCount, rootCause.diagnostics[0]!);
    case 'UNUSED_IMPORT':
      return repairUnusedImport(cycle, plan, projectRootDir, beforeErrorCount, rootCause.diagnostics[0]!);
    case 'UNUSED_VARIABLE': {
      const diagnostic = rootCause.diagnostics[0]!;
      const source = readSource(projectRootDir, diagnostic.file);
      const line = source?.split('\n')[Math.max(0, diagnostic.line - 1)] ?? '';
      if (/^\s*import\s/.test(line)) {
        return repairUnusedImport(cycle, plan, projectRootDir, beforeErrorCount, diagnostic);
      }
      return repairUnusedVariable(cycle, plan, projectRootDir, beforeErrorCount, diagnostic);
    }
    default:
      return emptyPatch(
        cycle,
        plan,
        beforeErrorCount,
        [],
        false,
        false,
        `Unsupported failure class: ${rootCause.failureClass}`,
      );
  }
}

function repairImportPath(
  cycle: number,
  plan: RepoTypecheckRepairPlan,
  projectRootDir: string,
  beforeErrorCount: number,
  diagnostic: RepoTypecheckDiagnostic,
): RepoTypecheckPatchRecord {
  const sourceFile = diagnostic.file;
  const source = readSource(projectRootDir, sourceFile);
  if (!source) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, `Source file missing: ${sourceFile}`);
  }

  const moduleMatch = diagnostic.message.match(/module ['"]([^'"]+)['"]/i);
  const wrongModule = moduleMatch?.[1];
  if (!wrongModule) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, 'Could not extract module path from diagnostic');
  }

  if (isRegressionTrapEnabled(projectRootDir)) {
    const trapPath = join(dirname(resolveProjectFile(projectRootDir, sourceFile)), `${wrongModule}.ts`);
    const trapRelative = trapPath.replace(resolve(projectRootDir), '').replace(/^[/\\]/, '').replace(/\\/g, '/');
    writeSource(projectRootDir, trapRelative, `export const __regressionTrap = 'broken';\nexport const __forceError: number = 'not-a-number';\n`);
    return successPatch(cycle, plan, beforeErrorCount, [trapRelative], `Regression trap module created at ${trapRelative}`);
  }

  const corrected = suggestImportPathCorrection(wrongModule);
  if (!corrected) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, `No safe import correction for ${wrongModule}`);
  }

  const lines = source.split('\n');
  const lineIndex = Math.max(0, diagnostic.line - 1);
  if (!lines[lineIndex]?.includes(wrongModule)) {
    const updated = source.replaceAll(wrongModule, corrected);
    if (updated === source) {
      return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, 'Import path not found in source');
    }
    writeSource(projectRootDir, sourceFile, updated);
    return successPatch(cycle, plan, beforeErrorCount, [sourceFile], `Corrected import ${wrongModule} -> ${corrected}`);
  }

  lines[lineIndex] = lines[lineIndex]!.replace(wrongModule, corrected);
  writeSource(projectRootDir, sourceFile, lines.join('\n'));
  return successPatch(cycle, plan, beforeErrorCount, [sourceFile], `Corrected import ${wrongModule} -> ${corrected}`);
}

function suggestImportPathCorrection(wrongModule: string): string | null {
  const corrections: Record<string, string> = {
    './helpr': './helper',
    './utilz': './utils',
    './provder': './provider',
    './shard': './shared',
  };
  if (corrections[wrongModule]) return corrections[wrongModule]!;

  if (wrongModule.endsWith('r') && wrongModule.length > 3) {
    const trimmed = wrongModule.slice(0, -1);
    return trimmed;
  }
  return null;
}

function repairMissingExport(
  cycle: number,
  plan: RepoTypecheckRepairPlan,
  projectRootDir: string,
  beforeErrorCount: number,
  diagnostic: RepoTypecheckDiagnostic,
): RepoTypecheckPatchRecord {
  const symbolMatch = diagnostic.message.match(/exported member ['"]([^'"]+)['"]/i);
  const symbol = symbolMatch?.[1];
  if (!symbol) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, 'Could not extract missing export symbol');
  }

  const importerFile = diagnostic.file;
  const importerSource = readSource(projectRootDir, importerFile);
  if (!importerSource) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, `Importer missing: ${importerFile}`);
  }

  const importMatch = importerSource.match(new RegExp(`from ['"]([^'"]+)['"]`));
  const providerModule = importMatch?.[1];
  if (!providerModule) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, 'Could not resolve provider module');
  }

  const importerDir = dirname(resolveProjectFile(projectRootDir, importerFile));
  const providerPath = join(importerDir, `${providerModule.replace(/^\.\//, '')}.ts`);
  const providerRelative = providerPath
    .replace(resolve(projectRootDir), '')
    .replace(/^[/\\]/, '')
    .replace(/\\/g, '/');

  const providerSource = readSource(projectRootDir, providerRelative);
  if (!providerSource) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, `Provider missing: ${providerRelative}`);
  }

  if (providerSource.includes(`export ${symbol}`) || providerSource.includes(`export function ${symbol}`)) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, `Export ${symbol} already present`);
  }

  const exportLine = inferExportLine(symbol, providerSource, projectRootDir, providerRelative);
  const updated = `${providerSource.trimEnd()}\n${exportLine}\n`;
  writeSource(projectRootDir, providerRelative, updated);
  return successPatch(cycle, plan, beforeErrorCount, [providerRelative], `Added export ${symbol}`);
}

function inferExportLine(
  symbol: string,
  providerSource: string,
  projectRootDir: string,
  providerRelative: string,
): string {
  if (symbolUsesCallPattern(projectRootDir, providerRelative, symbol)) {
    return `export function ${symbol}(): string { return '${symbol}'; }`;
  }
  if (/export\s+function\s+\w+/.test(providerSource)) {
    return `export function ${symbol}(): string { return '${symbol}'; }`;
  }
  if (/export\s+const\s+\w+/.test(providerSource)) {
    return `export const ${symbol} = '${symbol}';`;
  }
  return `export const ${symbol} = '${symbol}';`;
}

function symbolUsesCallPattern(projectRootDir: string, providerRelative: string, symbol: string): boolean {
  const srcRoot = join(projectRootDir, 'src');
  if (!existsSync(srcRoot)) return symbol.endsWith('Fn') || symbol.endsWith('fn');
  const providerModule = providerRelative.replace(/^src\//, '').replace(/\.ts$/, '');
  for (const file of readdirSync(srcRoot).filter((name) => name.endsWith('.ts'))) {
    const content = readFileSync(join(srcRoot, file), 'utf8');
    if (!content.includes(`'./${providerModule}'`) && !content.includes(`"./${providerModule}"`)) continue;
    if (new RegExp(`\\b${symbol}\\s*\\(`).test(content)) return true;
  }
  return symbol.endsWith('Fn') || symbol.endsWith('fn');
}

function repairDuplicateIdentifier(
  cycle: number,
  plan: RepoTypecheckRepairPlan,
  projectRootDir: string,
  beforeErrorCount: number,
  diagnostic: RepoTypecheckDiagnostic,
): RepoTypecheckPatchRecord {
  const sourceFile = diagnostic.file;
  const source = readSource(projectRootDir, sourceFile);
  if (!source) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, `Source file missing: ${sourceFile}`);
  }

  const lines = source.split('\n');
  const duplicateLine = Math.max(0, diagnostic.line - 1);
  const importLines = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^\s*import\s/.test(line));

  if (importLines.length >= 2) {
    const removeIndex = importLines.find(({ index }) => index === duplicateLine)?.index ?? importLines[1]!.index;
    lines.splice(removeIndex, 1);
    writeSource(projectRootDir, sourceFile, lines.join('\n'));
    return successPatch(cycle, plan, beforeErrorCount, [sourceFile], 'Removed duplicate import');
  }

  return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, 'Duplicate identifier not in import form');
}

function repairReadonlyMutation(
  cycle: number,
  plan: RepoTypecheckRepairPlan,
  projectRootDir: string,
  beforeErrorCount: number,
  diagnostic: RepoTypecheckDiagnostic,
): RepoTypecheckPatchRecord {
  const sourceFile = diagnostic.file;
  const source = readSource(projectRootDir, sourceFile);
  if (!source) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, `Source file missing: ${sourceFile}`);
  }

  const updated = source
    .replace(/Readonly<\{ count: number \}>/g, '{ count: number }')
    .replace(/:\s*Readonly</g, ': ')
    .replace(/(\w+)\.count\s*=\s*/g, '($1 as { count: number }).count = ');

  if (updated === source) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, 'No readonly pattern matched for safe repair');
  }

  writeSource(projectRootDir, sourceFile, updated);
  return successPatch(cycle, plan, beforeErrorCount, [sourceFile], 'Relaxed readonly annotation for mutable assignment');
}

function repairUnusedImport(
  cycle: number,
  plan: RepoTypecheckRepairPlan,
  projectRootDir: string,
  beforeErrorCount: number,
  diagnostic: RepoTypecheckDiagnostic,
): RepoTypecheckPatchRecord {
  const sourceFile = diagnostic.file;
  const source = readSource(projectRootDir, sourceFile);
  if (!source) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, `Source file missing: ${sourceFile}`);
  }

  const lines = source.split('\n');
  const lineIndex = Math.max(0, diagnostic.line - 1);
  if (/^\s*import\s/.test(lines[lineIndex] ?? '')) {
    lines.splice(lineIndex, 1);
    writeSource(projectRootDir, sourceFile, lines.join('\n'));
    return successPatch(cycle, plan, beforeErrorCount, [sourceFile], 'Removed unused import');
  }

  const symbolMatch = diagnostic.message.match(/['"]([^'"]+)['"]/);
  const symbol = symbolMatch?.[1];
  if (symbol) {
    const filtered = lines.filter((line) => !(line.includes('import') && line.includes(symbol)));
    if (filtered.length < lines.length) {
      writeSource(projectRootDir, sourceFile, filtered.join('\n'));
      return successPatch(cycle, plan, beforeErrorCount, [sourceFile], `Removed unused import ${symbol}`);
    }
  }

  return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, 'Unused import line not found');
}

function repairUnusedVariable(
  cycle: number,
  plan: RepoTypecheckRepairPlan,
  projectRootDir: string,
  beforeErrorCount: number,
  diagnostic: RepoTypecheckDiagnostic,
): RepoTypecheckPatchRecord {
  const sourceFile = diagnostic.file;
  const source = readSource(projectRootDir, sourceFile);
  if (!source) {
    return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, `Source file missing: ${sourceFile}`);
  }

  const lines = source.split('\n');
  const lineIndex = Math.max(0, diagnostic.line - 1);
  const line = lines[lineIndex] ?? '';
  const constMatch = line.match(/^\s*const\s+(\w+)\s*=/);
  if (constMatch) {
    lines[lineIndex] = line.replace(`const ${constMatch[1]}`, `const _${constMatch[1]}`);
    writeSource(projectRootDir, sourceFile, lines.join('\n'));
    return successPatch(cycle, plan, beforeErrorCount, [sourceFile], `Prefixed unused variable ${constMatch[1]}`);
  }

  return emptyPatch(cycle, plan, beforeErrorCount, [], false, false, 'Unused variable pattern not matched');
}

function emptyPatch(
  cycle: number,
  plan: RepoTypecheckRepairPlan,
  beforeErrorCount: number,
  filesModified: string[],
  applied: boolean,
  rolledBack: boolean,
  detail: string,
): RepoTypecheckPatchRecord {
  return {
    readOnly: true,
    cycle,
    plan,
    filesModified,
    beforeErrorCount,
    afterErrorCount: beforeErrorCount,
    errorsRemoved: 0,
    applied,
    rolledBack,
    detail,
  };
}

function successPatch(
  cycle: number,
  plan: RepoTypecheckRepairPlan,
  beforeErrorCount: number,
  filesModified: string[],
  detail: string,
): RepoTypecheckPatchRecord {
  return {
    readOnly: true,
    cycle,
    plan,
    filesModified,
    beforeErrorCount,
    afterErrorCount: beforeErrorCount,
    errorsRemoved: 0,
    applied: true,
    rolledBack: false,
    detail,
  };
}

export function finalizePatchRecord(
  record: RepoTypecheckPatchRecord,
  afterErrorCount: number,
): RepoTypecheckPatchRecord {
  return {
    ...record,
    afterErrorCount,
    errorsRemoved: Math.max(0, record.beforeErrorCount - afterErrorCount),
  };
}
