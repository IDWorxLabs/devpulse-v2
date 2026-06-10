/**
 * Founder Guides — checkpoint guide analyzer.
 */

import type { CheckpointGuideAnalysis, FounderGuidesInput } from './founder-guides-types.js';
import { getCachedCheckpointAnalysis, setCachedCheckpointAnalysis } from './founder-guides-cache.js';

export interface CheckpointGuideSnapshot {
  documentedCheckpoints: string[];
}

const BASE_CHECKPOINTS = [
  'trust_engine_verification',
  'product_hardening_verification',
  'documentation_checkpoint',
  'launch_checkpoint',
  'founder_readiness_checkpoint',
] as const;

let checkpointAnalysisCount = 0;

export function analyzeCheckpointGuide(
  input: FounderGuidesInput,
  snapshot: CheckpointGuideSnapshot,
): CheckpointGuideAnalysis {
  const cacheKey = [
    snapshot.documentedCheckpoints.length,
    input.missingTrustEngineCheckpoint,
    input.missingProductHardeningCheckpoint,
    input.missingLaunchCheckpointDocs,
    input.missingFounderReadinessCheckpoint,
    ...(input.undocumentedCheckpoints ?? []),
  ].join('|');

  const cached = getCachedCheckpointAnalysis(cacheKey);
  if (cached) return cached;

  checkpointAnalysisCount += 1;
  const checkpointWarnings: string[] = [];
  const undocumentedCheckpoints: string[] = [];
  let penalty = 0;

  if (input.missingTrustEngineCheckpoint === true) {
    checkpointWarnings.push('missing_trust_engine_checkpoint');
    penalty += 10;
  }
  if (input.missingProductHardeningCheckpoint === true) {
    checkpointWarnings.push('missing_product_hardening_checkpoint');
    penalty += 10;
  }
  if (input.missingLaunchCheckpointDocs === true) {
    checkpointWarnings.push('missing_launch_checkpoint_docs');
    penalty += 8;
  }
  if (input.missingFounderReadinessCheckpoint === true) {
    checkpointWarnings.push('missing_founder_readiness_checkpoint');
    penalty += 8;
  }

  for (const checkpoint of BASE_CHECKPOINTS) {
    const explicitlyMissing = (input.undocumentedCheckpoints ?? []).includes(checkpoint);
    const notDocumented = !snapshot.documentedCheckpoints.includes(checkpoint);
    if (explicitlyMissing || notDocumented) {
      undocumentedCheckpoints.push(checkpoint);
    }
  }

  for (const extra of input.undocumentedCheckpoints ?? []) {
    if (!undocumentedCheckpoints.includes(extra)) {
      undocumentedCheckpoints.push(extra);
      penalty += 5;
    }
  }

  const documented = BASE_CHECKPOINTS.length - undocumentedCheckpoints.filter(
    (c) => BASE_CHECKPOINTS.includes(c as typeof BASE_CHECKPOINTS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_CHECKPOINTS.length) * 92);
  const checkpointCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: CheckpointGuideAnalysis = {
    checkpointCoverageScore,
    undocumentedCheckpoints,
    checkpointWarnings,
  };

  setCachedCheckpointAnalysis(cacheKey, result);
  return result;
}

export function getCheckpointAnalysisCount(): number {
  return checkpointAnalysisCount;
}

export function resetCheckpointGuideAnalyzerForTests(): void {
  checkpointAnalysisCount = 0;
}

export function listBaseCheckpoints(): readonly string[] {
  return BASE_CHECKPOINTS;
}
