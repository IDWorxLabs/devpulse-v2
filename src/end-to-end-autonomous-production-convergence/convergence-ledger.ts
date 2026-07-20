/**
 * Persistent failure ledger for end-to-end autonomous production convergence.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type {
  CapabilityConvergenceOutcome,
  ConvergenceAttemptRecord,
  ConvergenceLedger,
  ConvergenceRootCauseClass,
} from './convergence-types.js';
import {
  E2E_AUTONOMOUS_PRODUCTION_CONVERGENCE_VERSION,
} from './convergence-types.js';

export function defaultConvergenceLedgerPath(rootDir: string): string {
  return join(rootDir, '.aidevengine', 'e2e-autonomous-production-convergence', 'failure-ledger.json');
}

export function createEmptyConvergenceLedger(): ConvergenceLedger {
  return {
    readOnly: true,
    version: E2E_AUTONOMOUS_PRODUCTION_CONVERGENCE_VERSION,
    attempts: [],
  };
}

export function loadConvergenceLedger(path: string): ConvergenceLedger {
  if (!existsSync(path)) return createEmptyConvergenceLedger();
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as ConvergenceLedger;
    return {
      readOnly: true,
      version: parsed.version ?? E2E_AUTONOMOUS_PRODUCTION_CONVERGENCE_VERSION,
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    };
  } catch {
    return createEmptyConvergenceLedger();
  }
}

export function saveConvergenceLedger(path: string, ledger: ConvergenceLedger): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
}

export function appendConvergenceAttempt(
  ledger: ConvergenceLedger,
  attempt: ConvergenceAttemptRecord,
): ConvergenceLedger {
  return {
    readOnly: true,
    version: E2E_AUTONOMOUS_PRODUCTION_CONVERGENCE_VERSION,
    attempts: [...ledger.attempts, attempt],
  };
}

export function fingerprintEnvelopeLike(value: unknown): string | null {
  if (!value) return null;
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

export function classifyRootCauseFromBuildFailure(input: {
  readonly failureReason: string | null;
  readonly gpcaHardStop: boolean;
  readonly gpcaGate: string | null;
  readonly blockedReasons: readonly string[];
}): { rootCauseClass: ConvergenceRootCauseClass; firstBlockingAuthority: string | null; firstBrokenBoundary: string | null; diagnosticCode: string | null } {
  const reason = input.failureReason ?? '';
  const blocked = input.blockedReasons.join(' ');
  if (input.gpcaHardStop || reason.includes('GENERATION_PIPELINE_NON_COMPLIANT')) {
    const nav = /navigation item/i.test(blocked) || /navigation item/i.test(reason);
    const title = /app title/i.test(blocked) || /app title/i.test(reason);
    return {
      rootCauseClass: 'GPCA_GENERATOR_INPUT_BYPASS',
      firstBlockingAuthority: 'Generation Pipeline Compliance Authority V1',
      firstBrokenBoundary: title ? 'Title / Product Identity Bypass' : nav ? 'Navigation Generator Input Bypass' : 'Generator Input Bypass',
      diagnosticCode: input.gpcaGate ?? 'GENERATION_PIPELINE_NON_COMPLIANT',
    };
  }
  if (/npm install failed/i.test(reason)) {
    return {
      rootCauseClass: 'RUNTIME_FAILURE',
      firstBlockingAuthority: 'npm install',
      firstBrokenBoundary: 'Dependency install',
      diagnosticCode: 'NPM_INSTALL_FAILED',
    };
  }
  if (/npm .*build failed|did not compile/i.test(reason)) {
    return {
      rootCauseClass: 'MATERIALIZATION_FAILURE',
      firstBlockingAuthority: 'npm build',
      firstBrokenBoundary: 'Compilation',
      diagnosticCode: 'NPM_BUILD_FAILED',
    };
  }
  if (/preview/i.test(reason)) {
    return {
      rootCauseClass: 'RUNTIME_FAILURE',
      firstBlockingAuthority: 'Live Preview',
      firstBrokenBoundary: 'Preview activation',
      diagnosticCode: 'PREVIEW_FAILED',
    };
  }
  return {
    rootCauseClass: 'UNKNOWN',
    firstBlockingAuthority: null,
    firstBrokenBoundary: null,
    diagnosticCode: reason ? 'BUILD_FAILED' : null,
  };
}

export function suggestCapabilityConvergenceOutcome(
  rootCauseClass: ConvergenceRootCauseClass,
): CapabilityConvergenceOutcome | null {
  switch (rootCauseClass) {
    case 'MISSING_CAPABILITY_IMPLEMENTATION':
      return 'GENERATE_NEW_UNIVERSAL_CAPABILITY';
    case 'MISSING_CAPABILITY_PACK':
      return 'GENERATE_NEW_UNIVERSAL_CAPABILITY_PACK';
    case 'MISSING_ENGINE_WIRING':
    case 'MISSING_GENERATOR_IMPLEMENTATION':
      return 'REPAIR_EXISTING_CAPABILITY';
    case 'EXTERNAL_PROVIDER_REQUIREMENT':
      return 'REQUIRE_EXTERNAL_PROVIDER';
    case 'CONFIGURATION_REQUIREMENT':
      return 'REQUIRE_APPROVED_CONFIGURATION';
    case 'GPCA_GENERATOR_INPUT_BYPASS':
    case 'IDENTITY_DRIFT':
      return 'REPAIR_EXISTING_CAPABILITY';
    default:
      return null;
  }
}

export function groupAttemptsByRootCause(
  ledger: ConvergenceLedger,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const attempt of ledger.attempts) {
    const key = attempt.rootCauseClass;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function detectRepeatedIdenticalFailure(
  ledger: ConvergenceLedger,
  fixtureId: string,
  diagnosticCode: string | null,
  rootCause: string | null,
): boolean {
  if (!diagnosticCode && !rootCause) return false;
  return ledger.attempts.some(
    (attempt) =>
      attempt.promptFixtureId === fixtureId &&
      attempt.diagnosticCode === diagnosticCode &&
      attempt.rootCause === rootCause &&
      attempt.finalDisposition !== 'SUCCEEDED',
  );
}
