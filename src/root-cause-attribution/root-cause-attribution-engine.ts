/**
 * Root Cause Attribution engine — rule-based cause attribution only.
 * No AI, LLM, execution, repair, or recovery.
 */

import { getDevPulseV2RealityReplayAuthority } from '../reality-replay/reality-replay-authority.js';
import { analyzePredictionSignals as readPredictionSignals } from './attribution-prediction-bridge.js';
import { analyzeEvidenceFromRegistry } from './attribution-evidence-bridge.js';
import { analyzeObservationHistory } from './attribution-self-vision-bridge.js';
import { analyzeSessionReplayHistory } from './attribution-session-replay-bridge.js';
import { analyzeVerificationHistory } from './attribution-verification-bridge.js';
import {
  createAttributionRecord,
  createCauseCandidateId,
  scoreAttributionConfidence,
} from './root-cause-attribution-scoring.js';
import type {
  AttributionRecord,
  AttributionSummary,
  CauseCandidate,
  CauseCategory,
} from './types.js';
import {
  CLICKABILITY_ATTRIBUTION_TITLE,
  UI_VISIBILITY_ATTRIBUTION_TITLE,
  VERIFICATION_ATTRIBUTION_TITLE,
} from './types.js';

export { createAttributionRecord, scoreAttributionConfidence } from './root-cause-attribution-scoring.js';

export function analyzeEvidence() {
  return analyzeEvidenceFromRegistry();
}

export function analyzeReplayHistory() {
  const sessionSignals = analyzeSessionReplayHistory();
  const reality = getDevPulseV2RealityReplayAuthority();
  let realityEvents = reality.getReplaySessions().flatMap((s) => s.events);
  if (realityEvents.length === 0) {
    reality.reconstructTimeline();
    realityEvents = reality.getReplaySessions().flatMap((s) => s.events);
  }

  const browserWarnCount =
    sessionSignals.browserWarnCount +
    realityEvents.filter(
      (e) =>
        e.sourceSystemId === 'browser_verification_harness' &&
        (e.warnings.length > 0 || e.description.toLowerCase().includes('warn')),
    ).length;

  return {
    sessionSignals,
    realityEventCount: realityEvents.length,
    browserWarnCount,
    evidenceIds: [...new Set([...sessionSignals.evidenceIds, ...realityEvents.flatMap((e) => e.evidenceIds)])],
  };
}

export function analyzePredictionSignals() {
  return readPredictionSignals();
}

export function generateCauseCandidates(): CauseCandidate[] {
  const observations = analyzeObservationHistory();
  const verification = analyzeVerificationHistory();
  const replay = analyzeReplayHistory();
  const evidence = analyzeEvidence();
  const predictions = readPredictionSignals();

  const candidates: CauseCandidate[] = [];

  if (observations.notClickableCount >= 2) {
    candidates.push({
      candidateId: createCauseCandidateId('CLICKABILITY'),
      category: 'CLICKABILITY',
      title: CLICKABILITY_ATTRIBUTION_TITLE,
      description: `${observations.notClickableCount} NOT_CLICKABLE observation(s) with ${replay.browserWarnCount} browser WARN signal(s).`,
      signalCount: observations.notClickableCount + replay.browserWarnCount,
      supportingEvidenceIds: [...observations.observationIds, ...replay.evidenceIds],
      supportingPredictionIds: predictions.highRiskPredictionIds,
      warnings: replay.browserWarnCount >= 2 ? ['Browser verification WARN patterns present.'] : [],
      errors: [],
    });
  }

  if (observations.hiddenCount >= 2) {
    candidates.push({
      candidateId: createCauseCandidateId('UI_VISIBILITY'),
      category: 'UI_VISIBILITY',
      title: UI_VISIBILITY_ATTRIBUTION_TITLE,
      description: `${observations.hiddenCount} HIDDEN UI observation(s) indicate visibility surfacing failure.`,
      signalCount: observations.hiddenCount,
      supportingEvidenceIds: observations.observationIds,
      supportingPredictionIds: predictions.highRiskPredictionIds,
      warnings: [],
      errors: [],
    });
  }

  if (verification.failureCount >= 2) {
    candidates.push({
      candidateId: createCauseCandidateId('VERIFICATION'),
      category: 'VERIFICATION',
      title: VERIFICATION_ATTRIBUTION_TITLE,
      description: `${verification.failureCount} verification failure(s) indicate proof chain breakdown.`,
      signalCount: verification.failureCount,
      supportingEvidenceIds: verification.evidenceIds,
      supportingPredictionIds: predictions.predictions
        .filter((p) => p.title.toLowerCase().includes('validation'))
        .map((p) => p.predictionId),
      warnings: verification.partialCount > 0 ? [`${verification.partialCount} partial verification(s).`] : [],
      errors: [],
    });
  }

  if (evidence.failCount >= 2) {
    candidates.push({
      candidateId: createCauseCandidateId('DEPENDENCY'),
      category: 'DEPENDENCY',
      title: 'Likely Dependency Failure',
      description: `${evidence.failCount} FAIL evidence record(s) suggest dependency or integration issues.`,
      signalCount: evidence.failCount,
      supportingEvidenceIds: evidence.records.filter((r) => r.status === 'FAIL').map((r) => r.evidenceId),
      supportingPredictionIds: [],
      warnings: [],
      errors: [],
    });
  }

  if (replay.browserWarnCount >= 2 && observations.notClickableCount === 0 && observations.hiddenCount === 0) {
    candidates.push({
      candidateId: createCauseCandidateId('TIMING'),
      category: 'TIMING',
      title: 'Likely Timing Failure',
      description: `${replay.browserWarnCount} browser WARN signal(s) without visibility failures suggest timing latency.`,
      signalCount: replay.browserWarnCount,
      supportingEvidenceIds: replay.evidenceIds,
      supportingPredictionIds: predictions.mediumRiskCount > 0 ? predictions.highRiskPredictionIds : [],
      warnings: [],
      errors: [],
    });
  }

  return candidates;
}

function candidateToAttribution(candidate: CauseCandidate): AttributionRecord {
  const hasHighPrediction = candidate.supportingPredictionIds.length > 0;
  const hasFailEvidence = candidate.supportingEvidenceIds.length >= 2;

  return createAttributionRecord({
    title: candidate.title,
    description: candidate.description,
    category: candidate.category,
    confidence: scoreAttributionConfidence(
      candidate.signalCount,
      hasHighPrediction,
      hasFailEvidence,
    ),
    supportingEvidenceIds: candidate.supportingEvidenceIds,
    supportingPredictionIds: candidate.supportingPredictionIds,
    warnings: [
      'Root Cause Attribution identifies likely causes only — no repair, recovery, or execution.',
      ...candidate.warnings,
    ],
    errors: [...candidate.errors],
  });
}

export function generateAttributions(): AttributionRecord[] {
  return generateCauseCandidates().map(candidateToAttribution);
}

export function summarizeAttributions(records: AttributionRecord[]): AttributionSummary {
  return {
    attributionCount: records.length,
    highConfidenceCount: records.filter((r) => r.confidence === 'HIGH').length,
    mediumConfidenceCount: records.filter((r) => r.confidence === 'MEDIUM').length,
    lowConfidenceCount: records.filter((r) => r.confidence === 'LOW').length,
    warnings: records.flatMap((r) => r.warnings),
    errors: records.flatMap((r) => r.errors),
  };
}

export function getCategoryDistribution(
  records: AttributionRecord[],
): Partial<Record<CauseCategory, number>> {
  const counts: Partial<Record<CauseCategory, number>> = {};
  for (const record of records) {
    counts[record.category] = (counts[record.category] ?? 0) + 1;
  }
  return counts;
}
