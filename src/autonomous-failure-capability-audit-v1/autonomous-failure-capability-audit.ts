/**
 * Autonomous Failure Diagnosis + Capability Detection Audit V1 — audit engine.
 *
 * AUDIT ONLY. Every function in this file only READS files from disk (existsSync/readFileSync).
 * Nothing here writes to, patches, or otherwise modifies any generated workspace or any part of
 * the real build pipeline. There is no new authority, gate, or protection layer here — this module
 * only observes and reports on systems that already exist elsewhere in the codebase.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import type {
  AuditCandidateSystemDefinition,
  AuditCandidateSystemResult,
  AuditEvidenceCitation,
  AuditFailureClass,
  AuditFailureClassCoverageResult,
  AuditProductionReachabilityReport,
} from './autonomous-failure-capability-audit-types.js';

/** The one confirmed, real production build entrypoint — see report for the empirical proof. */
export const PRODUCTION_BUILD_ENTRYPOINT = 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts';

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

function readTextSafe(absPath: string): string | null {
  try {
    return readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

function lineNumberOf(text: string, searchIndex: number): number {
  return text.slice(0, searchIndex).split('\n').length;
}

/**
 * Resolves a relative ESM import specifier (e.g. "../foo/bar.js" or "./baz.js") against the
 * importing file's real location on disk, trying the .ts source and index.ts fallback, exactly
 * how the real TypeScript/tsx module resolution behaves for this codebase's "*.js" import style.
 */
function resolveRelativeImport(fromFileAbs: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null; // ignore bare/package/node: imports
  const base = resolve(dirname(fromFileAbs), specifier);
  const candidates = [
    base,
    base.replace(/\.js$/, '.ts'),
    base.replace(/\.js$/, '.tsx'),
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base.replace(/\.js$/, ''), 'index.ts'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const IMPORT_SPECIFIER_PATTERN = /from\s+['"](\.[^'"]+)['"]/g;

function extractImportSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  let match: RegExpExecArray | null;
  IMPORT_SPECIFIER_PATTERN.lastIndex = 0;
  while ((match = IMPORT_SPECIFIER_PATTERN.exec(source)) !== null) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

/** Extracts "src/<module-name>" from an absolute file path, or null if outside src/. */
function moduleDirOf(repoRoot: string, absFile: string): string | null {
  const rel = toPosix(relative(repoRoot, absFile));
  const match = rel.match(/^src\/([^/]+)\//);
  return match ? `src/${match[1]}` : null;
}

/**
 * Real, deterministic BFS over the ACTUAL import graph starting at the confirmed production
 * build entrypoint. This is how "wired into the real build path" is proven or disproven in this
 * audit — not by name-matching, but by literally following `from '...'` specifiers on disk,
 * exactly the way Node/tsx module resolution would, and recording every module directory (and the
 * first path that reached it) that is transitively imported.
 */
export function computeProductionReachability(
  repoRoot: string,
  entrypointRelPath: string = PRODUCTION_BUILD_ENTRYPOINT,
  maxFilesVisited = 6000,
): {
  report: AuditProductionReachabilityReport;
  moduleFirstPath: Map<string, string[]>;
} {
  const entrypointAbs = join(repoRoot, entrypointRelPath);
  const entrypointExists = existsSync(entrypointAbs);
  const moduleFirstPath = new Map<string, string[]>();

  if (!entrypointExists) {
    return {
      report: {
        readOnly: true,
        entrypointFile: entrypointRelPath,
        entrypointExists: false,
        filesVisited: 0,
        modulesReached: [],
        computedDeterministically: true,
      },
      moduleFirstPath,
    };
  }

  const visitedFiles = new Set<string>([entrypointAbs]);
  // BFS queue of [absoluteFilePath, importChainOfModuleDirsToHere]
  const queue: Array<{ file: string; chain: string[] }> = [{ file: entrypointAbs, chain: [] }];
  const entrypointModule = moduleDirOf(repoRoot, entrypointAbs);
  if (entrypointModule) moduleFirstPath.set(entrypointModule, [entrypointModule]);

  let filesVisited = 0;
  while (queue.length > 0 && filesVisited < maxFilesVisited) {
    const { file, chain } = queue.shift()!;
    filesVisited += 1;
    const source = readTextSafe(file);
    if (!source) continue;

    for (const specifier of extractImportSpecifiers(source)) {
      const resolved = resolveRelativeImport(file, specifier);
      if (!resolved || visitedFiles.has(resolved)) continue;
      visitedFiles.add(resolved);

      const mod = moduleDirOf(repoRoot, resolved);
      let nextChain = chain;
      if (mod && !moduleFirstPath.has(mod)) {
        nextChain = [...chain, mod];
        moduleFirstPath.set(mod, nextChain);
      } else if (mod) {
        nextChain = moduleFirstPath.get(mod) ?? chain;
      }

      queue.push({ file: resolved, chain: nextChain });
    }
  }

  return {
    report: {
      readOnly: true,
      entrypointFile: entrypointRelPath,
      entrypointExists: true,
      filesVisited,
      modulesReached: [...moduleFirstPath.keys()].sort(),
      computedDeterministically: true,
    },
    moduleFirstPath,
  };
}

function listTsFilesRecursive(dirAbs: string, depth = 0): string[] {
  if (depth > 6) return [];
  let entries: string[] = [];
  let names: string[];
  try {
    names = readdirSync(dirAbs);
  } catch {
    return [];
  }
  for (const name of names) {
    const abs = join(dirAbs, name);
    let stat;
    try {
      stat = statSync(abs);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      entries = entries.concat(listTsFilesRecursive(abs, depth + 1));
    } else if (/\.tsx?$/.test(name)) {
      entries.push(abs);
    }
  }
  return entries;
}

const EXPORTED_DECL_PATTERN = /export\s+(function|class|const|async function)\s+[A-Za-z0-9_]+/g;

/** Weak fallback heuristic used only when a system has no specific real-logic probe defined:
 * a module with essentially no exported functions/classes/consts across all its files is treated
 * as "no real logic found" (pure re-export barrels/empty scaffolds do not count as real logic). */
function countNonTrivialExports(dirAbs: string): number {
  let count = 0;
  for (const file of listTsFilesRecursive(dirAbs)) {
    const source = readTextSafe(file);
    if (!source) continue;
    const matches = source.match(EXPORTED_DECL_PATTERN);
    count += matches ? matches.length : 0;
  }
  return count;
}

export function auditCandidateSystem(
  repoRoot: string,
  definition: AuditCandidateSystemDefinition,
  reachableModules: ReadonlySet<string>,
  moduleFirstPath: ReadonlyMap<string, string[]>,
): AuditCandidateSystemResult {
  const dirAbs = join(repoRoot, definition.moduleDir);
  const existsOnDisk = existsSync(dirAbs) && statSync(dirAbs).isDirectory();
  const files = existsOnDisk ? listTsFilesRecursive(dirAbs) : [];
  const fileCount = files.length;

  let hasRealLogicEvidence = false;
  let realLogicCitation: AuditEvidenceCitation | null = null;

  if (existsOnDisk && definition.realLogicProbe) {
    const probeAbs = join(dirAbs, definition.realLogicProbe.relativeFile);
    const source = readTextSafe(probeAbs);
    if (source) {
      const re = new RegExp(definition.realLogicProbe.markerPattern);
      const match = re.exec(source);
      if (match) {
        hasRealLogicEvidence = true;
        realLogicCitation = {
          readOnly: true,
          file: toPosix(join(definition.moduleDir, definition.realLogicProbe.relativeFile)),
          line: lineNumberOf(source, match.index),
          detail: `Found: ${definition.realLogicProbe.markerDescription} (matched "${match[0]}")`,
        };
      } else {
        realLogicCitation = {
          readOnly: true,
          file: toPosix(join(definition.moduleDir, definition.realLogicProbe.relativeFile)),
          line: null,
          detail: `NOT found: ${definition.realLogicProbe.markerDescription}`,
        };
      }
    } else {
      realLogicCitation = {
        readOnly: true,
        file: toPosix(join(definition.moduleDir, definition.realLogicProbe.relativeFile)),
        line: null,
        detail: 'Probe file does not exist on disk.',
      };
    }
  } else if (existsOnDisk) {
    const exportCount = countNonTrivialExports(dirAbs);
    hasRealLogicEvidence = exportCount > 0;
    realLogicCitation = {
      readOnly: true,
      file: toPosix(definition.moduleDir),
      line: null,
      detail: `Heuristic: ${exportCount} exported function/class/const declaration(s) found across ${fileCount} file(s).`,
    };
  }

  const wiredIntoProduction = existsOnDisk && reachableModules.has(definition.moduleDir);
  const wiringPathFromEntrypoint = wiredIntoProduction
    ? moduleFirstPath.get(definition.moduleDir) ?? []
    : [];

  let directlyInvokedEvidence = false;
  let directlyInvokedCitation: AuditEvidenceCitation | null = null;
  if (definition.callSiteProbe) {
    const callSiteAbs = join(repoRoot, definition.callSiteProbe.file);
    const source = readTextSafe(callSiteAbs);
    if (source) {
      const re = new RegExp(definition.callSiteProbe.markerPattern);
      const match = re.exec(source);
      directlyInvokedEvidence = !!match;
      directlyInvokedCitation = {
        readOnly: true,
        file: definition.callSiteProbe.file,
        line: match ? lineNumberOf(source, match.index) : null,
        detail: match
          ? `Found real call site: ${definition.callSiteProbe.markerDescription} (matched "${match[0]}")`
          : `NOT found: ${definition.callSiteProbe.markerDescription}`,
      };
    } else {
      directlyInvokedCitation = {
        readOnly: true,
        file: definition.callSiteProbe.file,
        line: null,
        detail: 'Call-site probe file does not exist on disk.',
      };
    }
  }

  let verdict: AuditCandidateSystemResult['verdict'];
  if (!existsOnDisk) {
    verdict = 'MISSING';
  } else if (!hasRealLogicEvidence) {
    verdict = 'EXISTS_BUT_NO_REAL_LOGIC_FOUND';
  } else if (wiredIntoProduction) {
    verdict = 'WIRED_AND_REAL';
  } else {
    verdict = 'REAL_BUT_UNUSED';
  }

  const oneLineFinding = !existsOnDisk
    ? `${definition.moduleDir} does not exist on disk — no such system was found.`
    : !hasRealLogicEvidence
      ? `${definition.moduleDir} exists (${fileCount} file(s)) but no real implementation logic was found — appears to be a scaffold/placeholder.`
      : wiredIntoProduction
        ? `${definition.moduleDir} has real logic and IS reachable from ${PRODUCTION_BUILD_ENTRYPOINT} (path: ${wiringPathFromEntrypoint.join(' -> ') || definition.moduleDir}).`
        : `${definition.moduleDir} has real logic but is NOT reachable from ${PRODUCTION_BUILD_ENTRYPOINT} — exists but unused by the real build path.`;

  return {
    readOnly: true,
    definition,
    existsOnDisk,
    fileCount,
    hasRealLogicEvidence,
    realLogicCitation,
    wiredIntoProduction,
    wiringPathFromEntrypoint,
    directlyInvokedEvidence,
    directlyInvokedCitation,
    verdict,
    oneLineFinding,
  };
}

interface FailureClassProbe {
  failureClass: AuditFailureClass;
  file: string;
  markerPattern: string;
  markerDescription: string;
  ownerModule: string;
}

/** Every probe below cites a real file this audit personally verified contains the marker. */
const FAILURE_CLASS_PROBES: FailureClassProbe[] = [
  {
    failureClass: 'COMPILER_ERROR',
    file: 'src/autonomous-engineering-executive/aee-build-autofix-loop.ts',
    markerPattern: "'TYPESCRIPT_ERROR'|'INVALID_JSX_TSX'|'MISSING_IMPORT_EXPORT'",
    markerDescription: 'classifyBuildFailure() distinguishes TYPESCRIPT_ERROR / INVALID_JSX_TSX / MISSING_IMPORT_EXPORT from build stderr',
    ownerModule: 'src/autonomous-engineering-executive',
  },
  {
    failureClass: 'MISSING_MODULE',
    file: 'src/autonomous-engineering-executive/aee-build-autofix-loop.ts',
    markerPattern: "'MISSING_DEPENDENCY'",
    markerDescription: 'classifyBuildFailure() classifies "cannot find module" output as MISSING_DEPENDENCY',
    ownerModule: 'src/autonomous-engineering-executive',
  },
  {
    failureClass: 'PREVIEW_FAILURE',
    file: 'src/autonomous-engineering-executive/index.ts',
    markerPattern: 'runAeePreviewRecoveryLoop',
    markerDescription: 'a dedicated preview-recovery loop exists and is exported',
    ownerModule: 'src/autonomous-engineering-executive',
  },
  {
    failureClass: 'PRODUCT_DRIFT',
    file: 'src/build-result-normalizer-v1/build-result-normalizer-types.ts',
    markerPattern: "FAILED_PRODUCT_DRIFT",
    markerDescription: 'NormalizedBuildResultKind includes FAILED_PRODUCT_DRIFT',
    ownerModule: 'src/build-result-normalizer-v1',
  },
  {
    failureClass: 'CONTRACT_DRIFT',
    file: 'src/build-result-normalizer-v1/build-result-normalizer-types.ts',
    markerPattern: "FAILED_CONTRACT_INCONSISTENCY",
    markerDescription: 'NormalizedBuildResultKind includes FAILED_CONTRACT_INCONSISTENCY',
    ownerModule: 'src/build-result-normalizer-v1',
  },
  {
    failureClass: 'STALE_EVIDENCE',
    file: 'src/universal-build-pipeline-verification/universal-build-pipeline-types.ts',
    markerPattern: 'STALE_EVIDENCE_BLOCKER',
    markerDescription: 'BlockerClass includes STALE_EVIDENCE_BLOCKER',
    ownerModule: 'src/universal-build-pipeline-verification',
  },
  {
    failureClass: 'RUNTIME_HANG',
    file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    markerPattern: 'markStall',
    markerDescription: 'executionMonitor.markStall(...) is invoked when build output matches a timeout/hang pattern',
    ownerModule: 'src/build-execution-stabilizer-v1',
  },
];

export function auditFailureClassCoverage(repoRoot: string): AuditFailureClassCoverageResult[] {
  return FAILURE_CLASS_PROBES.map((probe) => {
    const abs = join(repoRoot, probe.file);
    const source = readTextSafe(abs);
    const re = new RegExp(probe.markerPattern);
    const match = source ? re.exec(source) : null;
    const handled = !!match;
    return {
      readOnly: true,
      failureClass: probe.failureClass,
      handled,
      citation: source
        ? {
            readOnly: true,
            file: probe.file,
            line: match ? lineNumberOf(source, match.index) : null,
            detail: handled ? `Found: ${probe.markerDescription}` : `NOT found: ${probe.markerDescription}`,
          }
        : { readOnly: true, file: probe.file, line: null, detail: 'Probe file does not exist on disk.' },
      ownerModule: handled ? probe.ownerModule : null,
      note: handled
        ? `${probe.failureClass} is distinguished by ${probe.ownerModule} (see citation).`
        : `${probe.failureClass} has no dedicated real classification found at the probed location.`,
    };
  });
}
