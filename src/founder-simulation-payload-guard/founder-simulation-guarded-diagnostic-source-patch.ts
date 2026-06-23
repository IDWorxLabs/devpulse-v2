/**
 * Phase 27.08 — Founder Simulation guarded diagnostic source patch (V1).
 * Patches the live guarded diagnostic path only; no new authority layer.
 */

import { normalizeRawResultLaunchVerdictGovernanceSource } from '../launch-verdict-governance-source-normalization/index.js';

export const FOUNDER_SIMULATION_GUARDED_DIAGNOSTIC_SOURCE_PATCH_PASS =
  'FOUNDER_SIMULATION_GUARDED_DIAGNOSTIC_SOURCE_PATCH_PASS';

export const LAUNCH_VERDICT_GOVERNANCE_GUARDED_DIAGNOSTIC_PREFIX =
  'report.v4.launchVerdictGovernance';

export function isLaunchVerdictGovernanceGuardedDiagnosticPath(path: string): boolean {
  return path.startsWith(LAUNCH_VERDICT_GOVERNANCE_GUARDED_DIAGNOSTIC_PREFIX);
}

export function isGovernanceLengthCrashOriginalError(error: string | null | undefined): boolean {
  if (!error) return false;
  const lengthCrash =
    error.includes("reading 'length'") || error.includes('reading length');
  if (!lengthCrash) return false;
  return (
    error.includes('launchVerdictGovernance') ||
    error.includes('requiredEvidenceMissing') ||
    error.includes('blockingAuthorities')
  );
}

export function resolveGuardedDiagnosticOriginalError(input: {
  originalError: string | null | undefined;
  governanceSourceNormalized: boolean;
}): string | null {
  if (!input.originalError) return null;
  if (
    input.governanceSourceNormalized &&
    isGovernanceLengthCrashOriginalError(input.originalError)
  ) {
    return null;
  }
  return input.originalError;
}

/** Apply governance source normalization without JSON round-trip on the full payload. */
export function mergeGovernanceSourceNormalizationIntoRaw(rawResult: unknown): {
  workingRaw: unknown;
  governanceSourceNormalized: boolean;
  appliedPaths: string[];
} {
  const sourcePrep = normalizeRawResultLaunchVerdictGovernanceSource(rawResult);
  if (sourcePrep.appliedPaths.length === 0) {
    return {
      workingRaw: sourcePrep.patched,
      governanceSourceNormalized: false,
      appliedPaths: [],
    };
  }

  if (!rawResult || typeof rawResult !== 'object') {
    return {
      workingRaw: sourcePrep.patched,
      governanceSourceNormalized: true,
      appliedPaths: sourcePrep.appliedPaths,
    };
  }

  const merged = { ...(rawResult as Record<string, unknown>) };
  const patched = sourcePrep.patched;
  if (!patched || typeof patched !== 'object') {
    return {
      workingRaw: sourcePrep.patched,
      governanceSourceNormalized: true,
      appliedPaths: sourcePrep.appliedPaths,
    };
  }

  const patchedReport = (patched as Record<string, unknown>).report;
  if (!patchedReport || typeof patchedReport !== 'object') {
    return {
      workingRaw: sourcePrep.patched,
      governanceSourceNormalized: true,
      appliedPaths: sourcePrep.appliedPaths,
    };
  }

  const rawReport =
    merged.report && typeof merged.report === 'object'
      ? { ...(merged.report as Record<string, unknown>) }
      : {};
  const patchedV4 = (patchedReport as Record<string, unknown>).v4;
  const rawV4 =
    rawReport.v4 && typeof rawReport.v4 === 'object'
      ? { ...(rawReport.v4 as Record<string, unknown>) }
      : {};

  merged.report = {
    ...rawReport,
    v4: {
      ...rawV4,
      launchVerdictGovernance:
        patchedV4 && typeof patchedV4 === 'object'
          ? (patchedV4 as Record<string, unknown>).launchVerdictGovernance
          : rawV4.launchVerdictGovernance,
    },
  };

  return {
    workingRaw: merged,
    governanceSourceNormalized: true,
    appliedPaths: sourcePrep.appliedPaths,
  };
}
