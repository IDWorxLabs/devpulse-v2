/**
 * Product Reality Orchestrator — authority conflict detector.
 */

import type {
  ConflictDetectionResult,
  ProductRealityAggregate,
  UpstreamReportBundle,
} from './product-reality-types.js';
import { CONFLICT_DETECTION_PASS } from './product-reality-types.js';
import { boundList, createAuthorityConflict } from './product-reality-model.js';
import { MAX_AUTHORITY_CONFLICTS } from './product-reality-types.js';
import { getCachedConflictDetection, setCachedConflictDetection } from './product-reality-cache.js';

let conflictDetectionCount = 0;

function scoreTier(score: number): 'excellent' | 'good' | 'weak' | 'poor' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'weak';
  return 'poor';
}

export function detectAuthorityConflicts(
  requestId: string,
  aggregate: ProductRealityAggregate,
  reports: UpstreamReportBundle,
): ConflictDetectionResult {
  const cacheKey = [requestId, aggregate.overallExperienceScore, reports.visualQa.overallScore].join('|');
  const cached = getCachedConflictDetection(cacheKey);
  if (cached) return cached;

  conflictDetectionCount += 1;
  const conflicts = [];

  const visualTier = scoreTier(reports.visualQa.overallScore);
  const experienceTier = scoreTier(reports.productExperience.overallProductExperienceScore);
  if ((visualTier === 'excellent' || visualTier === 'good') && (experienceTier === 'weak' || experienceTier === 'poor')) {
    conflicts.push(createAuthorityConflict({
      subsystemA: 'Visual QA Engine',
      subsystemB: 'Product Experience Verification Engine',
      conflictSeverity: 'HIGH',
      conflictExplanation: 'Visual QA reports strong quality while Product Experience Engine reports fragmentation',
      detectionCode: 'AUTHORITY_CONFLICT',
    }));
  }

  const polishReady = reports.autoPolish.autoPolishResult === 'PASS' && reports.autoPolish.criticalOpportunities === 0;
  const launchBlocked = reports.productExperience.launchReadinessScore < 65
    || reports.productExperience.productExperienceResult === 'FAIL';
  if (polishReady && launchBlocked) {
    conflicts.push(createAuthorityConflict({
      subsystemA: 'Auto-Polish Loop',
      subsystemB: 'Product Experience Verification Engine',
      conflictSeverity: 'CRITICAL',
      conflictExplanation: 'Auto-Polish indicates readiness while launch readiness continuity reports blocked',
      detectionCode: 'AUTHORITY_CONFLICT',
    }));
  }

  const uxPass = reports.uxHeuristics.uxHeuristicResult === 'PASS';
  const founderFail = reports.productExperience.founderExperienceScore < 65;
  if (uxPass && founderFail) {
    conflicts.push(createAuthorityConflict({
      subsystemA: 'UX Heuristic Evaluator',
      subsystemB: 'Product Experience Verification Engine',
      conflictSeverity: 'HIGH',
      conflictExplanation: 'UX heuristics pass while founder experience continuity fails',
      detectionCode: 'AUTHORITY_CONFLICT',
    }));
  }

  if (reports.firstImpression.launchReadinessPerceptionScore >= 80
    && aggregate.launchReadinessScore < 60) {
    conflicts.push(createAuthorityConflict({
      subsystemA: 'First-Impression Judge',
      subsystemB: 'Product Reality Aggregate',
      conflictSeverity: 'MEDIUM',
      conflictExplanation: 'First impression launch perception diverges from aggregate launch readiness score',
      detectionCode: 'AUTHORITY_CONFLICT',
    }));
  }

  if (reports.livePreview.overallScore >= 80
    && reports.productExperience.verificationContinuityScore < 65) {
    conflicts.push(createAuthorityConflict({
      subsystemA: 'Live Preview Gatekeeper',
      subsystemB: 'Product Experience Verification Engine',
      conflictSeverity: 'MEDIUM',
      conflictExplanation: 'Preview scores well but verification continuity remains disconnected',
      detectionCode: 'AUTHORITY_CONFLICT',
    }));
  }

  const result: ConflictDetectionResult = {
    conflicts: boundList(conflicts, MAX_AUTHORITY_CONFLICTS),
    passToken: CONFLICT_DETECTION_PASS,
  };
  setCachedConflictDetection(cacheKey, result);
  return result;
}

export function getConflictDetectionCount(): number {
  return conflictDetectionCount;
}

export function resetAuthorityConflictDetectorForTests(): void {
  conflictDetectionCount = 0;
}
