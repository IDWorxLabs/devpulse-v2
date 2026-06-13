/**
 * Runtime Log Analyzer — analyze runtime logs for boot and error signals.
 */

import type { RuntimeLogAssessment, RuntimeSessionEvidence } from './connected-runtime-activation-proof-types.js';

const READY_SIGNALS = [
  /server listening/i,
  /ready in \d+/i,
  /compiled successfully/i,
  /local:\s*https?:\/\//i,
  /started server/i,
  /listening on/i,
];

const FATAL_SIGNALS = [
  /fatal error/i,
  /eaddrinuse/i,
  /port \d+ is already in use/i,
  /cannot find module/i,
  /build failed/i,
  /error: /i,
];

const WARNING_SIGNALS = [/warning/i, /deprecated/i];

export function analyzeRuntimeLogs(input: {
  sessionEvidence?: RuntimeSessionEvidence;
}): RuntimeLogAssessment {
  const lines = input.sessionEvidence?.logLines ?? [];
  if (lines.length === 0) {
    return {
      readOnly: true,
      bootComplete: false,
      readySignalFound: false,
      fatalErrorFound: false,
      warningCount: 0,
      errorCount: 0,
      confidence: 0,
      notableSignals: [],
    };
  }

  const notableSignals: string[] = [];
  let readySignalFound = false;
  let fatalErrorFound = false;
  let warningCount = 0;
  let errorCount = 0;

  for (const line of lines) {
    if (READY_SIGNALS.some((pattern) => pattern.test(line))) {
      readySignalFound = true;
      notableSignals.push(line.slice(0, 120));
    }
    if (FATAL_SIGNALS.some((pattern) => pattern.test(line))) {
      fatalErrorFound = true;
      errorCount += 1;
      notableSignals.push(line.slice(0, 120));
    }
    if (WARNING_SIGNALS.some((pattern) => pattern.test(line))) {
      warningCount += 1;
    }
  }

  const bootComplete = readySignalFound && !fatalErrorFound;

  return {
    readOnly: true,
    bootComplete,
    readySignalFound,
    fatalErrorFound,
    warningCount,
    errorCount,
    confidence: bootComplete ? 85 : readySignalFound ? 60 : fatalErrorFound ? 70 : 30,
    notableSignals: notableSignals.slice(0, 5),
  };
}
