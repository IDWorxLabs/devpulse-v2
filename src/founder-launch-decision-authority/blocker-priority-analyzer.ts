/**
 * Blocker priority analyzer — rank actionable blockers from upstream authorities.
 */

import type {
  AssessFounderLaunchDecisionInput,
  BlockerPriorityAnalysis,
  BlockerPriorityEntry,
} from './founder-launch-decision-authority-types.js';
import type { StageAnalysis } from '../live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-types.js';

function entry(
  blockerId: string,
  severity: BlockerPriorityEntry['severity'],
  sourceAuthority: string,
  message: string,
  recommendedFix: string,
  priorityRank: number,
): BlockerPriorityEntry {
  return {
    readOnly: true,
    blockerId,
    severity,
    sourceAuthority,
    message,
    recommendedFix,
    priorityRank,
  };
}

function collectExecutionStageBlockers(
  runner: NonNullable<AssessFounderLaunchDecisionInput['liveExecutionRunner']>,
  startRank: number,
): BlockerPriorityEntry[] {
  const out: BlockerPriorityEntry[] = [];
  let rank = startRank;
  const stages: StageAnalysis[] = [
    runner.idea,
    runner.planning,
    runner.build,
    runner.validation,
    runner.runtime,
    runner.launch,
  ];
  for (const stage of stages) {
    if (stage.evidenceLevel === 'BLOCKED' || (!stage.confirmed && stage.evidenceLevel === 'MISSING')) {
      out.push(
        entry(
          `execution-${stage.stage}`,
          stage.evidenceLevel === 'BLOCKED' ? 'CRITICAL' : 'HIGH',
          'live-idea-to-launch-execution-runner',
          `${stage.stage} stage ${stage.evidenceLevel}: ${stage.recommendedFix}`,
          stage.recommendedFix,
          rank++,
        ),
      );
    }
  }
  return out;
}

export function analyzeBlockerPriority(snapshot: {
  launchReadinessProof: AssessFounderLaunchDecisionInput['launchReadinessProof'];
  founderTestLaunchReadiness: AssessFounderLaunchDecisionInput['founderTestLaunchReadiness'];
  founderTestRealitySweep: AssessFounderLaunchDecisionInput['founderTestRealitySweep'];
  liveExecutionRunner: AssessFounderLaunchDecisionInput['liveExecutionRunner'];
  launchCouncil: AssessFounderLaunchDecisionInput['launchCouncil'];
}): BlockerPriorityAnalysis {
  const blockers: BlockerPriorityEntry[] = [];
  let rank = 1;

  const launchProofAuthoritative = snapshot.launchReadinessProof?.launchProofLevel === 'PROVEN';

  for (const b of snapshot.launchReadinessProof?.blockers.blockers ?? []) {
    blockers.push(
      entry(
        b.blockerId,
        b.severity,
        'connected-launch-readiness-proof',
        b.message,
        b.recommendedFix,
        rank++,
      ),
    );
  }

  if (!launchProofAuthoritative) {
    snapshot.founderTestLaunchReadiness?.topBlockers.forEach((b, i) => {
      blockers.push(
        entry(
          `founder-launch-${i}`,
          b.severity,
          'founder-test-launch-readiness',
          b.explanation,
          b.recommendedAction,
          rank++,
        ),
      );
    });

    for (const b of snapshot.founderTestRealitySweep?.launchBlockers ?? []) {
      blockers.push(
        entry(
          b.blockerId,
          b.severity,
          'founder-test-reality-sweep',
          b.title || b.explanation,
          b.recommendedAction,
          rank++,
        ),
      );
    }
  }

  if (snapshot.liveExecutionRunner) {
    blockers.push(...collectExecutionStageBlockers(snapshot.liveExecutionRunner, rank));
    rank += blockers.length;
  }

  if (snapshot.launchCouncil && snapshot.launchCouncil.readinessState !== 'READY') {
    const councilBlockers = snapshot.launchCouncil.authorityResults
      .filter((a) => a.launchBlocker)
      .flatMap((a) => a.findings.slice(0, 1));
    for (const issue of councilBlockers.slice(0, 3)) {
      blockers.push(
        entry(
          `council-${rank}`,
          'HIGH',
          'launch-council',
          issue,
          snapshot.launchCouncil.recommendations[0] ?? 'Resolve Launch Council blocker',
          rank++,
        ),
      );
    }
  }

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  blockers.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.priorityRank - b.priorityRank);

  const criticalCount = blockers.filter((b) => b.severity === 'CRITICAL').length;
  const highCount = blockers.filter((b) => b.severity === 'HIGH').length;
  const actionableBlockers = blockers.filter((b) => b.severity === 'CRITICAL' || b.severity === 'HIGH');

  return {
    readOnly: true,
    blockers: blockers.slice(0, 16),
    criticalCount,
    highCount,
    actionableBlockers: actionableBlockers.slice(0, 8),
  };
}
