/**
 * PRODUCT_FAITHFULNESS_EVIDENCE_TRACE_V1 — trace log, stale-evidence comparator, and static
 * source audits.
 *
 * Trace-only: nothing here mutates production state, blocks evidence, or changes behavior. It
 * either (a) records evidence entries the caller reports to it in-memory, (b) compares recorded
 * entries' requestId/buildId/projectId/promptHash against the current build's own identity, or
 * (c) reads real source files on disk (read-only) to locate known risk patterns (module-level
 * mutable state, fallback-to-previous paths, "recovered concept" repair paths, hardcoded
 * domain/concept glossaries) and reports their exact file/line.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  EvidenceTraceEntry,
  FallbackPathFinding,
  GlobalStateFinding,
  HardcodedConceptListFinding,
  PipelineStage,
  RecoveryPathFinding,
  StaleEvidenceTraceDetection,
  StaleEvidenceTraceMismatchField,
} from './product-faithfulness-trace-types.js';

export function resolveRepoRoot(): string {
  // this file lives at <repoRoot>/src/product-faithfulness-trace-v1/product-faithfulness-trace.ts
  return join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
}

// -------------------------------------------------------------------------------------------
// In-memory trace log
// -------------------------------------------------------------------------------------------

let traceLog: EvidenceTraceEntry[] = [];
let sequenceCounter = 0;

export function resetEvidenceTraceLog(): void {
  traceLog = [];
  sequenceCounter = 0;
}

export function getEvidenceTraceLog(): EvidenceTraceEntry[] {
  return [...traceLog];
}

export function recordEvidenceTrace(entry: {
  stage: PipelineStage;
  requestId: string;
  buildId: string;
  projectId: string;
  promptHash: string;
  sourceFile: string;
  sourceModule: string;
  owner: string;
  productIdentity: string | null;
  conceptList: string[];
  scopeId?: string | null;
  accepted: boolean;
  reasonAccepted?: string | null;
  reasonRejected?: string | null;
}): EvidenceTraceEntry {
  sequenceCounter += 1;
  const recorded: EvidenceTraceEntry = {
    readOnly: true,
    sequence: sequenceCounter,
    stage: entry.stage,
    requestId: entry.requestId,
    buildId: entry.buildId,
    projectId: entry.projectId,
    promptHash: entry.promptHash,
    sourceFile: entry.sourceFile,
    sourceModule: entry.sourceModule,
    owner: entry.owner,
    productIdentity: entry.productIdentity,
    conceptList: entry.conceptList,
    timestamp: new Date().toISOString(),
    scopeId: entry.scopeId ?? null,
    accepted: entry.accepted,
    reasonAccepted: entry.reasonAccepted ?? null,
    reasonRejected: entry.reasonRejected ?? null,
  };
  traceLog.push(recorded);
  return recorded;
}

// -------------------------------------------------------------------------------------------
// Stale-evidence comparator — compares a recorded entry against the *current* build's own
// identity (requestId/buildId/projectId/promptHash). Detection-only: never blocks anything.
// -------------------------------------------------------------------------------------------

export function detectStaleEvidenceInTrace(
  entries: EvidenceTraceEntry[],
  currentBuild: { requestId: string; buildId: string; projectId: string; promptHash: string },
): StaleEvidenceTraceDetection[] {
  const detections: StaleEvidenceTraceDetection[] = [];
  for (const entry of entries) {
    const mismatched: StaleEvidenceTraceMismatchField[] = [];
    if (entry.requestId !== currentBuild.requestId) mismatched.push('requestId');
    if (entry.buildId !== currentBuild.buildId) mismatched.push('buildId');
    if (entry.projectId !== currentBuild.projectId) mismatched.push('projectId');
    if (entry.promptHash !== currentBuild.promptHash) mismatched.push('promptHash');
    if (mismatched.length === 0) continue;

    detections.push({
      readOnly: true,
      entrySequence: entry.sequence,
      stage: entry.stage,
      mismatchedFields: mismatched,
      whichObject: `${entry.stage} evidence (concepts: ${entry.conceptList.join(', ') || '(none)'}; productIdentity: ${entry.productIdentity ?? '(none)'})`,
      whichSource: entry.sourceFile,
      producingModule: entry.sourceModule,
      whyAccepted: entry.accepted
        ? entry.reasonAccepted ?? '(no reasonAccepted recorded by caller)'
        : '(not accepted)',
      whyNotRejected: entry.accepted
        ? 'No requestId/buildId/projectId/promptHash check exists on this code path today — the evidence carries no metadata that a comparator could check, so nothing rejects it before it is used.'
        : entry.reasonRejected ?? '(no reasonRejected recorded by caller)',
    });
  }
  return detections;
}

// -------------------------------------------------------------------------------------------
// Static source audits — read-only. Every finding below quotes the *actual* current line from
// disk (not a hardcoded assumption) so the report cannot silently go stale relative to the code.
// -------------------------------------------------------------------------------------------

function readRepoFile(root: string, relPath: string): string[] {
  return readFileSync(join(root, relPath), 'utf8').split(/\r?\n/);
}

function enclosingFunctionName(lines: string[], lineIndex: number): string {
  for (let i = lineIndex; i >= 0; i--) {
    const m = lines[i].match(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/);
    if (m) return m[1];
  }
  return '(module scope)';
}

/**
 * Scans a fixed set of real pipeline files for module-level mutable state (singletons, process-
 * wide Maps/Sets, and on-disk cache read-back calls) that could survive across builds.
 */
export function auditGlobalState(root: string, relFiles: string[]): GlobalStateFinding[] {
  const findings: GlobalStateFinding[] = [];
  for (const relFile of relFiles) {
    let lines: string[];
    try {
      lines = readRepoFile(root, relFile);
    } catch {
      continue;
    }
    lines.forEach((line, idx) => {
      const letSingleton = line.match(/^let\s+([A-Za-z0-9_]+)\s*:.*=.*;?\s*$/) ?? line.match(/^let\s+([A-Za-z0-9_]+)\s*=/);
      if (letSingleton) {
        findings.push({
          readOnly: true,
          file: relFile,
          line: idx + 1,
          symbol: letSingleton[1],
          kind: 'MODULE_LEVEL_MUTABLE_SINGLETON',
          snippet: line.trim(),
          survivesAcrossBuilds: true,
          note: 'Module-level `let` binding — persists for the lifetime of the Node process, i.e. across every build handled by that process, unless something explicitly resets it before each build.',
        });
      }
      const mapOrSet = line.match(/^(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*(?::[^=]+)?=\s*new\s+(Map|Set)\s*\(/);
      if (mapOrSet) {
        findings.push({
          readOnly: true,
          file: relFile,
          line: idx + 1,
          symbol: mapOrSet[1],
          kind: 'PROCESS_WIDE_MAP_OR_SET',
          snippet: line.trim(),
          survivesAcrossBuilds: true,
          note: 'Module-level Map/Set — process-wide, not per-build. Safe only if every entry is strictly keyed by a fresh-per-build identifier and explicitly invalidated before/after use; still a stale-evidence risk if any caller reads an entry keyed by something that is NOT guaranteed fresh per build (e.g. a caller-supplied projectId).',
        });
      }
      if (/readManifest\(/.test(line) && !/^function readManifest/.test(line.trim())) {
        findings.push({
          readOnly: true,
          file: relFile,
          line: idx + 1,
          symbol: enclosingFunctionName(lines, idx),
          kind: 'ON_DISK_CACHE_READ_BACK',
          snippet: line.trim(),
          survivesAcrossBuilds: true,
          note: 'Reads a manifest file already sitting on disk for the given workspace directory. Whatever that file contained from a *previous* write is returned verbatim; this call has no way to distinguish "previous build, same workspace dir" from "no prior build at all" other than existsSync.',
        });
      }
    });
  }
  return findings;
}

/** Scans for "if current evidence is missing, fall back to X" style code paths. */
export function auditFallbackPaths(root: string, relFiles: string[]): FallbackPathFinding[] {
  const findings: FallbackPathFinding[] = [];
  const FALLBACK_PATTERNS: Array<{ re: RegExp; fallsBackTo: string }> = [
    { re: /existing\?\.[A-Za-z0-9_]+\s*\?\?/, fallsBackTo: 'previous on-disk manifest field (`existing`)' },
    { re: /existing\?\.[A-Za-z0-9_]+\s*,?\s*$/, fallsBackTo: 'previous on-disk manifest field (`existing`)' },
    { re: /getLast[A-Za-z0-9_]*\(/, fallsBackTo: 'last-computed process-wide singleton (getLast* getter)' },
    { re: /\?\?\s*(?:lastModulePlan|lastGuardResult)\b/, fallsBackTo: 'last-computed process-wide module plan/guard result' },
  ];
  for (const relFile of relFiles) {
    let lines: string[];
    try {
      lines = readRepoFile(root, relFile);
    } catch {
      continue;
    }
    lines.forEach((line, idx) => {
      for (const pattern of FALLBACK_PATTERNS) {
        if (pattern.re.test(line)) {
          findings.push({
            readOnly: true,
            file: relFile,
            line: idx + 1,
            function: enclosingFunctionName(lines, idx),
            snippet: line.trim(),
            fallsBackTo: pattern.fallsBackTo,
            note: 'Evidence for the *current* build silently inherits a value from a source that is not guaranteed to belong to the current build/request.',
          });
          break;
        }
      }
    });
  }
  return findings;
}

/** Scans for "recovered concept" repair paths and explains exactly which collection they draw from. */
export function auditRecoveryPaths(root: string, relFiles: string[]): RecoveryPathFinding[] {
  const findings: RecoveryPathFinding[] = [];
  for (const relFile of relFiles) {
    let lines: string[];
    try {
      lines = readRepoFile(root, relFile);
    } catch {
      continue;
    }
    lines.forEach((line, idx) => {
      if (/Recovered "/.test(line) || /conceptPresentSomewhere/.test(line)) {
        findings.push({
          readOnly: true,
          file: relFile,
          line: idx + 1,
          function: enclosingFunctionName(lines, idx),
          snippet: line.trim(),
          sourceCollectionExplanation:
            'Recovery pulls a concept into a stage whose evidence is missing it, from a map built by scanning every OTHER stage\'s already-extracted concepts (conceptPresentSomewhere). It never checks whether that concept is only present in another stage because that stage\'s evidence is itself stale — it only checks "does this concept exist anywhere else in the evidence bundle handed to this audit call".',
        });
      }
    });
  }
  return findings;
}

/**
 * Parses the real DOMAIN_GLOSSARY out of product-faithfulness-feature-extractor.ts and flags
 * keywords generic enough to plausibly appear in an unrelated domain's prompt/generated text.
 */
export function auditHardcodedConceptGlossary(root: string, relFile: string): HardcodedConceptListFinding[] {
  const text = readFileSync(join(root, relFile), 'utf8');
  const lines = text.split(/\r?\n/);
  const findings: HardcodedConceptListFinding[] = [];

  // Generic-English-word reference list used only to flag *candidates* for human review — this is
  // a diagnostic heuristic, not a new domain rule, and never changes extraction behavior.
  const GENERIC_WORD_HINTS = new Set([
    'calculate', 'calculation', 'product', 'products', 'times', 'sum', 'service', 'services',
    'customer', 'customers', 'client', 'clients', 'sales', 'revenue', 'book', 'schedule',
    'dashboard', 'contact', 'contacts', 'display', 'clear', 'reset',
  ]);

  const bundleStartRegex = /domain:\s*'([^']+)'/;
  let currentDomain: string | null = null;
  let currentTriggerKeywords: string[] = [];
  let currentConcepts: Array<{ concept: string; keywords: string[] }> = [];
  let domainLine = -1;

  function flush(): void {
    if (currentDomain === null) return;
    const riskyGenericKeywords = [
      ...new Set(
        [...currentTriggerKeywords, ...currentConcepts.flatMap((c) => c.keywords)].filter((kw) =>
          GENERIC_WORD_HINTS.has(kw.toLowerCase()),
        ),
      ),
    ];
    findings.push({
      readOnly: true,
      file: relFile,
      line: domainLine,
      domainLabel: currentDomain,
      triggerKeywords: currentTriggerKeywords,
      concepts: currentConcepts,
      riskyGenericKeywords,
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const domainMatch = line.match(bundleStartRegex);
    if (domainMatch) {
      flush();
      currentDomain = domainMatch[1];
      currentTriggerKeywords = [];
      currentConcepts = [];
      domainLine = i + 1;
      continue;
    }
    if (currentDomain === null) continue;
    const triggerMatch = line.match(/triggerKeywords:\s*\[([^\]]*)\]/);
    if (triggerMatch) {
      currentTriggerKeywords = [...triggerMatch[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
      continue;
    }
    const conceptMatch = line.match(/\{\s*concept:\s*'([^']+)',\s*keywords:\s*\[([^\]]*)\]\s*\}/);
    if (conceptMatch) {
      currentConcepts.push({
        concept: conceptMatch[1],
        keywords: [...conceptMatch[2].matchAll(/'([^']*)'/g)].map((m) => m[1]),
      });
    }
  }
  flush();

  return findings;
}
