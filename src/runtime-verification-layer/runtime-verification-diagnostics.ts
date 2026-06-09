/**
 * Runtime Verification Layer diagnostics.
 */

import type { RuntimeVerificationDiagnostics, RuntimeVerificationReport } from './runtime-verification-types.js';

let diagnostics: RuntimeVerificationDiagnostics = {
  runtimeVerificationActive: false,
  verificationReportCount: 0,
  verifiedCount: 0,
  blockedVerificationCount: 0,
  averageVerificationScore: 0,
  lastVerificationQuery: null,
};

let scoreAccumulator = 0;

export function getRuntimeVerificationDiagnostics(): RuntimeVerificationDiagnostics {
  return { ...diagnostics };
}

export function updateRuntimeVerificationDiagnostics(
  query: string,
  report: RuntimeVerificationReport,
): void {
  scoreAccumulator += report.verificationScore;
  const count = diagnostics.verificationReportCount + 1;

  diagnostics = {
    runtimeVerificationActive: true,
    verificationReportCount: count,
    verifiedCount:
      diagnostics.verifiedCount +
      (report.state === 'VERIFIED' || report.state === 'PARTIALLY_VERIFIED' ? 1 : 0),
    blockedVerificationCount: diagnostics.blockedVerificationCount + (report.blocked ? 1 : 0),
    averageVerificationScore: Math.round(scoreAccumulator / count),
    lastVerificationQuery: query,
  };
}

export function resetRuntimeVerificationDiagnostics(): void {
  diagnostics = {
    runtimeVerificationActive: false,
    verificationReportCount: 0,
    verifiedCount: 0,
    blockedVerificationCount: 0,
    averageVerificationScore: 0,
    lastVerificationQuery: null,
  };
  scoreAccumulator = 0;
}

export function runtimeVerificationKey(): string {
  const d = diagnostics;
  return [
    String(d.runtimeVerificationActive),
    String(d.verificationReportCount),
    String(d.verifiedCount),
    String(d.blockedVerificationCount),
    String(d.averageVerificationScore),
    d.lastVerificationQuery ?? 'none',
  ].join('|');
}
