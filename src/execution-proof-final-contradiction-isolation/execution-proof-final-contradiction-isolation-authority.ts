/**
 * Phase 27.06 — Execution Proof Final Contradiction Isolation authority (V1).
 * Read-only diagnostic. No reconciliation, convergence, or truth-matrix authority.
 */

import { createHash } from 'node:crypto';
import { isolateLaunchCriticalAuthorityEvidence } from './launch-critical-authority-isolator.js';
import { rankContradictionSources } from './contradiction-source-ranker.js';
import {
  EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_CACHE_KEY_PREFIX,
  EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_CORE_QUESTION,
  EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PASS,
  FINAL_STALE_CONSUMER_AUTHORITY_ID,
} from './execution-proof-final-contradiction-isolation-registry.js';
import { recordExecutionProofFinalContradictionIsolationReport, resetExecutionProofFinalContradictionIsolationHistoryForTests } from './execution-proof-final-contradiction-isolation-history.js';
import type {
  AssessExecutionProofFinalContradictionIsolationInput,
  ExecutionProofFinalContradictionIsolationAssessment,
} from './execution-proof-final-contradiction-isolation-types.js';

let isolationCounter = 0;

export function resetExecutionProofFinalContradictionIsolationCounterForTests(): void {
  isolationCounter = 0;
}

export function resetExecutionProofFinalContradictionIsolationModuleForTests(): void {
  resetExecutionProofFinalContradictionIsolationCounterForTests();
  resetExecutionProofFinalContradictionIsolationHistoryForTests();
}

function nextIsolationId(): string {
  isolationCounter += 1;
  return `execution-proof-final-contradiction-isolation-${isolationCounter}-${Date.now()}`;
}

function stableCacheKey(isolationId: string, isolated: boolean): string {
  const digest = createHash('sha256')
    .update(
      [EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PASS, isolationId, String(isolated)].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_CACHE_KEY_PREFIX}:${digest}`;
}

export async function assessExecutionProofFinalContradictionIsolation(
  input: AssessExecutionProofFinalContradictionIsolationInput = {},
): Promise<ExecutionProofFinalContradictionIsolationAssessment> {
  const rootDir = input.rootDir ?? process.cwd();
  const isolationId = nextIsolationId();
  const generatedAt = new Date().toISOString();

  const { authoritative, consumptions } = await isolateLaunchCriticalAuthorityEvidence({
    rootDir,
    runId: input.runId ?? null,
  });

  const { rankedTable, summary } = rankContradictionSources(consumptions);

  const passToken =
    summary.contradictionCount > 0 && summary.finalStaleConsumerAuthorityId
      ? EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PASS
      : null;

  const report = {
    readOnly: true as const,
    isolationId,
    generatedAt,
    coreQuestion: EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_CORE_QUESTION,
    authoritative,
    consumptions,
    rankedTable,
    summary: {
      ...summary,
      finalStaleConsumerAuthorityId:
        summary.finalStaleConsumerAuthorityId ?? FINAL_STALE_CONSUMER_AUTHORITY_ID,
    },
    passToken,
  };

  if (!input.skipHistoryRecording) {
    recordExecutionProofFinalContradictionIsolationReport(report);
  }

  stableCacheKey(isolationId, passToken != null);

  return {
    readOnly: true,
    advisoryOnly: true,
    report,
  };
}
