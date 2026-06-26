/**
 * Launch Readiness Authority V2 — decision audit trail.
 */

import type {
  LaunchBlockerRecord,
  LaunchConfidenceResult,
  LaunchDecisionAuditRecord,
  LaunchEvidenceCollectionResult,
  LaunchReadinessScoreResult,
  LaunchVerdictResult,
} from './launch-readiness-types.js';
import { EVIDENCE_SCHEMA_VERSION } from './launch-readiness-types.js';

let decisionCounter = 0;

function nextDecisionId(): string {
  decisionCounter += 1;
  return `launch-decision-${decisionCounter}`;
}

export function resetLaunchDecisionAuditForTests(): void {
  decisionCounter = 0;
}

export function buildLaunchDecisionAudit(input: {
  evidence: LaunchEvidenceCollectionResult;
  blockers: readonly LaunchBlockerRecord[];
  confidence: LaunchConfidenceResult;
  scores: LaunchReadinessScoreResult;
  verdict: LaunchVerdictResult;
  decisionTrace: readonly string[];
}): LaunchDecisionAuditRecord {
  return {
    readOnly: true,
    decisionId: nextDecisionId(),
    timestamp: input.evidence.collectedAt,
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    evidenceSources: input.evidence.sources.map((s) => s.sourceId),
    evidenceVersions: input.evidence.sources.map((s) => s.schemaVersion),
    warnings: input.evidence.sources.flatMap((s) => s.warnings).slice(0, 24),
    blockers: [...input.blockers],
    confidence: input.confidence,
    scores: input.scores,
    verdict: input.verdict,
    decisionTrace: input.decisionTrace,
  };
}
