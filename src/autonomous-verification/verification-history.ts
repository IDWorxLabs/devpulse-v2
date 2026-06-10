/**
 * Autonomous Verification — bounded history.
 */

import type {
  AutonomousVerificationResult,
  VerificationDecision,
  VerificationHistoryEntry,
  VerificationReadiness,
} from './autonomous-verification-types.js';
import { MAX_VERIFICATION_HISTORY_SIZE } from './autonomous-verification-types.js';
import { evaluateVerificationReadiness } from './verification-readiness-evaluator.js';
import { analyzeVerificationEvidence } from './evidence-analyzer.js';
import type { VerificationInput } from './autonomous-verification-types.js';

const history: VerificationHistoryEntry[] = [];
let historyCounter = 0;

export function recordVerificationHistory(
  result: AutonomousVerificationResult,
  input?: VerificationInput,
): VerificationHistoryEntry {
  historyCounter += 1;

  const readiness: VerificationReadiness = input
    ? evaluateVerificationReadiness(
        input,
        result.decision,
        analyzeVerificationEvidence(input),
        result.trustScore,
        result.riskScore,
        result.confidence,
      )
    : 'NEEDS_MORE_EVIDENCE';

  const entry: VerificationHistoryEntry = {
    historyId: `verification-history-${historyCounter}`,
    resultId: result.id,
    decision: result.decision,
    readiness,
    recordedAt: Date.now(),
  };

  history.unshift(entry);
  if (history.length > MAX_VERIFICATION_HISTORY_SIZE) {
    history.length = MAX_VERIFICATION_HISTORY_SIZE;
  }

  return entry;
}

export function getLatestVerificationDecisions(limit = 10): VerificationHistoryEntry[] {
  return history.slice(0, limit);
}

export function lookupVerificationHistoryByDecision(decision: VerificationDecision): VerificationHistoryEntry[] {
  return history.filter((e) => e.decision === decision);
}

export function lookupVerificationHistoryByReadiness(readiness: VerificationReadiness): VerificationHistoryEntry[] {
  return history.filter((e) => e.readiness === readiness);
}

export function getVerificationHistorySize(): number {
  return history.length;
}

export function resetVerificationHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
