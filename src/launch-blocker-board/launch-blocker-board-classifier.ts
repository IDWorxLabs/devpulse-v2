/**
 * Launch Blocker Board V1 — four-bucket classifier.
 */

import { DEFAULT_DISPOSITION_BY_BUCKET } from './launch-blocker-board-registry.js';
import type {
  LaunchBlockerBoardEntry,
  LaunchBlockerBucket,
  LaunchBlockerDisposition,
  LaunchBlockerLaunchImpact,
  LaunchBlockerSeverity,
} from './launch-blocker-board-types.js';
import type { FounderTestLaunchBlocker } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';

const UI_PATTERN =
  /\b(ui|ux|copy report|button|screen|route|panel|clipboard|mobile layout|responsive|visual|friction|heatmap)\b/i;
const CLAIM_PATTERN =
  /\b(claim|promise|wording|contradict|mismatch|marketing|copy|trust|unsupported|unproven)\b/i;
const NOISE_PATTERN =
  /\b(testing|validator|simulation budget|degraded runtime|payload guard|repair phase|authority repair|timeout recovery|orchestration|internal validation|missing fields repaired|patch applied)\b/i;
const PRODUCT_PATTERN =
  /\b(execution proof|preview|runtime|build|verification|launch readiness|product gap|not proven|blocks launch|connected)\b/i;

const SEVERITY_RANK: Record<LaunchBlockerSeverity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function classifyLaunchBlockerBucket(input: {
  text: string;
  sourceAuthority: string;
  explicitBucket?: LaunchBlockerBucket;
}): LaunchBlockerBucket {
  if (input.explicitBucket) return input.explicitBucket;

  const haystack = `${input.sourceAuthority} ${input.text}`.toLowerCase();
  if (NOISE_PATTERN.test(haystack)) return 'FOUNDER_TEST_NOISE';
  if (UI_PATTERN.test(haystack)) return 'UI_UX_GAP';
  if (CLAIM_PATTERN.test(haystack)) return 'CLAIM_WORDING_GAP';
  if (PRODUCT_PATTERN.test(haystack)) return 'REAL_PRODUCT_GAP';
  return 'REAL_PRODUCT_GAP';
}

export function deriveLaunchImpact(
  bucket: LaunchBlockerBucket,
  severity: LaunchBlockerSeverity,
): LaunchBlockerLaunchImpact {
  if (bucket === 'FOUNDER_TEST_NOISE') return 'NONE';
  if (bucket === 'CLAIM_WORDING_GAP') return severity === 'CRITICAL' || severity === 'HIGH' ? 'TRUST_RISK' : 'DELAYS_LAUNCH';
  if (bucket === 'UI_UX_GAP') return severity === 'CRITICAL' || severity === 'HIGH' ? 'DELAYS_LAUNCH' : 'TRUST_RISK';
  return severity === 'LOW' ? 'DELAYS_LAUNCH' : 'BLOCKS_LAUNCH';
}

export function deriveDisposition(
  bucket: LaunchBlockerBucket,
  severity: LaunchBlockerSeverity,
): LaunchBlockerDisposition {
  const base = DEFAULT_DISPOSITION_BY_BUCKET[bucket];
  if (bucket === 'FOUNDER_TEST_NOISE') return 'IGNORE';
  if (bucket === 'UI_UX_GAP' && severity === 'LOW') return 'DEFER';
  if (bucket === 'CLAIM_WORDING_GAP' && severity === 'LOW') return 'DEFER';
  return base;
}

export function entryFromLaunchBlocker(
  blocker: FounderTestLaunchBlocker,
  blockerId: string,
  blockerName: string,
  rank: number,
  explicitBucket?: LaunchBlockerBucket,
): LaunchBlockerBoardEntry {
  const bucket =
    explicitBucket ??
    classifyLaunchBlockerBucket({
      text: `${blocker.explanation} ${blocker.recommendedAction}`,
      sourceAuthority: blocker.sourceAuthority,
    });
  const severity = blocker.severity;
  return {
    readOnly: true,
    blockerId,
    blockerName,
    bucket,
    severity,
    userImpact: blocker.explanation,
    fixRequired: blocker.recommendedAction,
    launchImpact: deriveLaunchImpact(bucket, severity),
    disposition: deriveDisposition(bucket, severity),
    sourceAuthority: blocker.sourceAuthority,
    rank,
  };
}

export function sortLaunchBlockerEntries(entries: LaunchBlockerBoardEntry[]): LaunchBlockerBoardEntry[] {
  const bucketRank: Record<LaunchBlockerBucket, number> = {
    REAL_PRODUCT_GAP: 4,
    CLAIM_WORDING_GAP: 3,
    UI_UX_GAP: 2,
    FOUNDER_TEST_NOISE: 1,
  };

  return [...entries].sort((a, b) => {
    const bucketDelta = bucketRank[b.bucket] - bucketRank[a.bucket];
    if (bucketDelta !== 0) return bucketDelta;
    const severityDelta = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (severityDelta !== 0) return severityDelta;
    return a.rank - b.rank;
  });
}
