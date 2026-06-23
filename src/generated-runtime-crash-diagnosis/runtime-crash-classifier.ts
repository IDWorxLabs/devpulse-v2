/**
 * Runtime crash classifier (Phase 26.81 / 26.82).
 */

import { isSuccessfulHealthResponse } from '../runtime-startup-proof-repair/runtime-process-probe.js';
import { extractFileLineSymbol } from './startup-log-crash-extractor.js';
import type {
  RuntimeCrashClassification,
  RuntimeCrashClass,
  RuntimeEntrypointCrashMapping,
  StartupLogCrashExtraction,
} from './generated-runtime-crash-diagnosis-types.js';

const CLASS_PRIORITY: readonly RuntimeCrashClass[] = [
  'ENTRYPOINT_NOT_FOUND',
  'MISSING_IMPORT',
  'MODULE_FORMAT_MISMATCH',
  'SYNTAX_ERROR',
  'BAD_VITE_CONFIG',
  'BAD_SERVER_EXPORT',
  'PORT_BIND_FAILURE',
  'GENERATED_CODE_RUNTIME_ERROR',
  'PROCESS_EXITED_EARLY',
  'UNKNOWN_RUNTIME_CRASH',
];

function patternToClass(patternId: string): RuntimeCrashClass | null {
  switch (patternId) {
    case 'SYNTAX_ERROR':
      return 'SYNTAX_ERROR';
    case 'MISSING_IMPORT':
      return 'MISSING_IMPORT';
    case 'MODULE_FORMAT_MISMATCH':
      return 'MODULE_FORMAT_MISMATCH';
    case 'ENTRYPOINT_NOT_FOUND':
      return 'ENTRYPOINT_NOT_FOUND';
    case 'BAD_SERVER_EXPORT':
      return 'BAD_SERVER_EXPORT';
    case 'BAD_VITE_CONFIG':
      return 'BAD_VITE_CONFIG';
    case 'PORT_BIND_FAILURE':
      return 'PORT_BIND_FAILURE';
    case 'GENERATED_CODE_RUNTIME_ERROR':
      return 'GENERATED_CODE_RUNTIME_ERROR';
    case 'PROCESS_EXITED_EARLY':
    case 'PROBE_FALSE_POSITIVE':
      return 'PROCESS_EXITED_EARLY';
    default:
      return null;
  }
}

export function classifyRuntimeCrash(input: {
  extraction: StartupLogCrashExtraction;
  mapping: RuntimeEntrypointCrashMapping;
  firstResponseStatus?: number | null;
}): RuntimeCrashClassification {
  const { extraction, mapping } = input;

  const healthSuccess =
    mapping.processStarted &&
    mapping.healthResponded &&
    mapping.portBound &&
    isSuccessfulHealthResponse(input.firstResponseStatus ?? null);

  if (healthSuccess || (!mapping.processCrashed && mapping.healthResponded && mapping.portBound)) {
    return {
      readOnly: true,
      crashClass: 'NONE',
      crashClassReason: 'Health probe succeeded — no runtime crash; startup false-positive suppressed.',
      failingFile: null,
      failingLine: null,
      failingSymbol: null,
      evidenceConfidence: 0.95,
    };
  }

  const detectedClasses = new Set<RuntimeCrashClass>();
  for (const signal of extraction.extractedSignals) {
    const cls = patternToClass(signal.patternId);
    if (cls) detectedClasses.add(cls);
  }

  for (const cls of CLASS_PRIORITY) {
    if (detectedClasses.has(cls)) {
      const signal = extraction.extractedSignals.find((s) => patternToClass(s.patternId) === cls);
      const loc = signal ? extractFileLineSymbol(signal.line) : { failingFile: null, failingLine: null, failingSymbol: null };
      return {
        readOnly: true,
        crashClass: cls,
        crashClassReason: signal?.line ?? `Classified from startup evidence: ${cls}`,
        failingFile: loc.failingFile ?? mapping.entryFile,
        failingLine: loc.failingLine,
        failingSymbol: loc.failingSymbol,
        evidenceConfidence: signal ? 0.85 : 0.65,
      };
    }
  }

  if (extraction.exitCode !== null && extraction.exitCode !== 0) {
    return {
      readOnly: true,
      crashClass: 'PROCESS_EXITED_EARLY',
      crashClassReason: `Process exited with code ${extraction.exitCode} before application became healthy.`,
      failingFile: mapping.entryFile,
      failingLine: null,
      failingSymbol: null,
      evidenceConfidence: 0.7,
    };
  }

  if (mapping.processStarted && !mapping.healthResponded) {
    return {
      readOnly: true,
      crashClass: 'PROCESS_EXITED_EARLY',
      crashClassReason: 'Process started but did not remain healthy for startup probe.',
      failingFile: mapping.entryFile,
      failingLine: null,
      failingSymbol: null,
      evidenceConfidence: 0.6,
    };
  }

  return {
    readOnly: true,
    crashClass: 'UNKNOWN_RUNTIME_CRASH',
    crashClassReason: extraction.rawErrorExcerpt || 'No bounded crash signature extracted from startup logs.',
    failingFile: mapping.entryFile,
    failingLine: null,
    failingSymbol: null,
    evidenceConfidence: 0.4,
  };
}
