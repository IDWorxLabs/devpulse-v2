/**
 * Startup log crash extractor (Phase 26.81).
 */

import {
  CRASH_PATTERN_IDS,
  MAX_CRASH_LOG_LINES,
  MAX_RAW_ERROR_EXCERPT_CHARS,
} from './generated-runtime-crash-diagnosis-registry.js';
import type {
  ExtractedCrashSignal,
  StartupLogCrashExtraction,
} from './generated-runtime-crash-diagnosis-types.js';
import type { RuntimeStartupProbeResult } from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

interface CrashPattern {
  id: (typeof CRASH_PATTERN_IDS)[number];
  regex: RegExp;
}

const PATTERNS: readonly CrashPattern[] = [
  { id: 'SYNTAX_ERROR', regex: /SyntaxError:|Unexpected token|Parse error/i },
  { id: 'MISSING_IMPORT', regex: /Cannot find module|MODULE_NOT_FOUND|ENOENT.*node_modules/i },
  {
    id: 'MODULE_FORMAT_MISMATCH',
    regex: /ERR_REQUIRE_ESM|Must use import to load ES Module|module is not defined in ES module scope/i,
  },
  { id: 'ENTRYPOINT_NOT_FOUND', regex: /ENTRYPOINT_MISSING|ENOENT.*dev-server|Cannot find module.*dev-server/i },
  { id: 'BAD_SERVER_EXPORT', regex: /does not provide an export named|is not a function|listen is not a function/i },
  { id: 'BAD_VITE_CONFIG', regex: /vite\.config|Failed to load config|config error/i },
  { id: 'PORT_BIND_FAILURE', regex: /EADDRINUSE|address already in use|port.*in use/i },
  { id: 'GENERATED_CODE_RUNTIME_ERROR', regex: /TypeError:|ReferenceError:|RangeError:|Error:/i },
  { id: 'PROCESS_EXITED_EARLY', regex: /RUNTIME_CRASH exitCode=|exitCode=\d+/i },
  {
    id: 'PROBE_FALSE_POSITIVE',
    regex: /RUNTIME_CRASH exitCode=undefined|exitCode=null/i,
  },
];

function parseExitCode(fatalErrors: readonly string[]): number | null {
  for (const line of fatalErrors) {
    const match = line.match(/exitCode=(-?\d+)/);
    if (match?.[1]) return Number(match[1]);
  }
  return null;
}

function extractFileLineSymbol(line: string): {
  failingFile: string | null;
  failingLine: number | null;
  failingSymbol: string | null;
} {
  const atMatch = line.match(/at .+ \((.+):(\d+):(\d+)\)/);
  if (atMatch) {
    return {
      failingFile: atMatch[1] ?? null,
      failingLine: atMatch[2] ? Number(atMatch[2]) : null,
      failingSymbol: null,
    };
  }
  const fileMatch = line.match(/([\w./-]+\.(?:tsx?|jsx?|mjs|cjs)):(\d+)/);
  if (fileMatch) {
    return {
      failingFile: fileMatch[1] ?? null,
      failingLine: fileMatch[2] ? Number(fileMatch[2]) : null,
      failingSymbol: null,
    };
  }
  const moduleMatch = line.match(/Cannot find module '([^']+)'/);
  if (moduleMatch?.[1]) {
    return { failingFile: moduleMatch[1], failingLine: null, failingSymbol: moduleMatch[1] };
  }
  return { failingFile: null, failingLine: null, failingSymbol: null };
}

export function extractCrashSignals(input: {
  startupLogs: readonly string[];
  fatalErrors: readonly string[];
}): readonly ExtractedCrashSignal[] {
  const signals: ExtractedCrashSignal[] = [];
  const scanLine = (line: string, source: ExtractedCrashSignal['source']) => {
    for (const pattern of PATTERNS) {
      if (pattern.regex.test(line)) {
        signals.push({ readOnly: true, source, line: line.trim(), patternId: pattern.id });
      }
    }
  };

  for (const line of input.startupLogs.slice(-MAX_CRASH_LOG_LINES)) {
    scanLine(line, 'STDOUT');
  }
  for (const line of input.fatalErrors) {
    scanLine(line, 'FATAL_ERROR');
  }

  return signals;
}

export function extractStartupLogCrash(input: {
  probe: RuntimeStartupProbeResult;
}): StartupLogCrashExtraction {
  const logLines = input.probe.startupLogs.slice(-MAX_CRASH_LOG_LINES);
  const fatalErrors = input.probe.fatalErrors;
  const extractedSignals = extractCrashSignals({ startupLogs: logLines, fatalErrors });
  const blob = [...logLines, ...fatalErrors].join('\n').trim();
  const rawErrorExcerpt =
    blob.length <= MAX_RAW_ERROR_EXCERPT_CHARS
      ? blob
      : `${blob.slice(0, MAX_RAW_ERROR_EXCERPT_CHARS)}… [truncated]`;

  return {
    readOnly: true,
    logLines,
    fatalErrors,
    extractedSignals,
    rawErrorExcerpt,
    exitCode: parseExitCode(fatalErrors),
    processId: input.probe.processId,
  };
}

export { extractFileLineSymbol };
