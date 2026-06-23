/**
 * Phase 26.99 — Undefined `.length` stack parser.
 */

import type { UndefinedLengthStackFrame } from './founder-simulation-crash-locator-types.js';
import {
  UNDEFINED_LENGTH_ERROR_PATTERN,
  V5_REPORT_BUILDER_FILE_HINT,
} from './founder-simulation-crash-locator-registry.js';

const STACK_FRAME_PATTERN =
  /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/;

export function isUndefinedLengthCrashError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return UNDEFINED_LENGTH_ERROR_PATTERN.test(message);
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? 'unknown error');
}

export function extractErrorStack(error: unknown): string | null {
  if (error instanceof Error && error.stack) return error.stack;
  return null;
}

export function parseUndefinedLengthStack(stack: string | null | undefined): UndefinedLengthStackFrame[] {
  if (!stack) return [];

  const frames: UndefinedLengthStackFrame[] = [];
  for (const line of stack.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('at ')) continue;

    const match = trimmed.match(STACK_FRAME_PATTERN);
    if (!match) {
      frames.push({
        readOnly: true,
        functionName: null,
        filePath: null,
        lineNumber: null,
        columnNumber: null,
        raw: trimmed,
      });
      continue;
    }

    frames.push({
      readOnly: true,
      functionName: match[1]?.trim() ?? null,
      filePath: match[2]?.replace(/\\/g, '/').trim() ?? null,
      lineNumber: Number.parseInt(match[3] ?? '', 10) || null,
      columnNumber: Number.parseInt(match[4] ?? '', 10) || null,
      raw: trimmed,
    });
  }

  return frames;
}

export function findPrimaryCrashFrame(
  frames: readonly UndefinedLengthStackFrame[],
): UndefinedLengthStackFrame | null {
  for (const frame of frames) {
    const file = frame.filePath ?? '';
    if (
      file.includes(V5_REPORT_BUILDER_FILE_HINT) ||
      file.includes('runtime-failure-report-builder') ||
      file.includes('founder-result-store-delivery-repair') ||
      file.includes('founder-testing-handler')
    ) {
      return frame;
    }
  }
  return frames[0] ?? null;
}

export function formatCrashLocation(frame: UndefinedLengthStackFrame | null): string | null {
  if (!frame?.filePath) return frame?.raw ?? null;
  const parts = [frame.filePath];
  if (frame.lineNumber != null) parts.push(String(frame.lineNumber));
  if (frame.functionName) parts.unshift(frame.functionName);
  return parts.join(':');
}
