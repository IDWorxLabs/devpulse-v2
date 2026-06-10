/**
 * Founder Acceptance Orchestrator — authority builder.
 */

import type {
  FounderAcceptanceAuthority,
  FounderAcceptanceResult,
  FounderAcceptanceVerdict,
  FounderAcceptanceRoadmap,
  FounderAcceptanceOrchestratorInput,
  FounderAcceptanceAggregate,
  AuthorityConflictAnalysis,
  AcceptanceBlockerAnalysis,
  FounderAcceptanceAnalysis,
  ReadinessAcceptanceAnalysis,
  FrictionAcceptanceImpactAnalysis,
  AcceptanceGapAnalysis,
  FinalVerdict,
} from './founder-acceptance-orchestrator-types.js';
import {
  FINAL_VERDICT_PASS,
  resolveFounderAcceptanceResult,
  resolveFounderAcceptanceVerdict,
} from './founder-acceptance-orchestrator-types.js';
import { countCriticalGaps } from './acceptance-gap-model.js';
import { getCachedFounderAcceptanceAuthority, setCachedFounderAcceptanceAuthority } from './founder-acceptance-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

const VERDICT_REASON: Record<FounderAcceptanceVerdict, string> = {
  FOUNDER_REJECTS: 'Founder would not genuinely accept DevPulse in its current state',
  FOUNDER_PARTIALLY_ACCEPTS: 'Founder would partially accept DevPulse with significant reservations',
  FOUNDER_ACCEPTS: 'Founder would genuinely accept DevPulse for daily operation',
  FOUNDER_LAUNCH_ACCEPTS: 'Founder would accept DevPulse at launch scale without critical blockers',
};

export function buildFinalVerdict(
  verdict: FounderAcceptanceVerdict,
): FinalVerdict {
  return {
    verdict,
    verdictReason: VERDICT_REASON[verdict],
    passToken: FINAL_VERDICT_PASS,
  };
}

export function buildFounderAcceptanceAuthority(
  requestId: string,
  aggregate: FounderAcceptanceAggregate,
  conflicts: AuthorityConflictAnalysis,
  blockers: AcceptanceBlockerAnalysis,
  founderAcceptance: FounderAcceptanceAnalysis,
  readinessAcceptance: ReadinessAcceptanceAnalysis,
  frictionImpact: FrictionAcceptanceImpactAnalysis,
  gapAnalysis: AcceptanceGapAnalysis,
  roadmap: FounderAcceptanceRoadmap,
  input: FounderAcceptanceOrchestratorInput,
  launchBlockerCount: number,
  readinessStatus: string,
): FounderAcceptanceAuthority {
  const cacheKey = [requestId, aggregate.overallAcceptanceScore, founderAcceptance.score].join('|');
  const cached = getCachedFounderAcceptanceAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const founderAcceptanceScore = aggregate.overallAcceptanceScore;
  const criticalGaps = countCriticalGaps(gapAnalysis.gaps);
  const criticalBlockers = blockers.criticalAcceptanceBlockers.length;
  const majorGaps = gapAnalysis.majorAcceptanceGaps.length;

  const founderAcceptanceResult: FounderAcceptanceResult = resolveFounderAcceptanceResult(
    founderAcceptanceScore,
    criticalGaps,
    criticalBlockers,
    input.governanceBlocked,
  );

  const verdict = resolveFounderAcceptanceVerdict(
    founderAcceptanceScore,
    criticalGaps,
    criticalBlockers,
    majorGaps,
    launchBlockerCount,
    readinessStatus,
    input.governanceBlocked,
  );

  const finalVerdict = buildFinalVerdict(verdict);

  const confidence = Math.min(100, Math.round(
    (founderAcceptanceScore + aggregate.trustScore + aggregate.readinessScore) / 3
      - (criticalGaps + criticalBlockers) * 6
      - conflicts.conflicts.length * 2,
  ));

  const authority: FounderAcceptanceAuthority = {
    authorityId: `founder-acceptance-authority-${authorityCounter}`,
    aggregate,
    conflicts,
    blockers,
    founderAcceptance,
    readinessAcceptance,
    frictionImpact,
    gapAnalysis,
    roadmap,
    finalVerdict,
    founderAcceptanceScore: Math.max(0, founderAcceptanceScore),
    founderAcceptanceResult,
    confidence: Math.max(0, confidence),
    createdAt: Date.now(),
  };

  setCachedFounderAcceptanceAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetFounderAcceptanceAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
