/**
 * Launch Proof Contradiction Detector — launchProven false while all deps PROVEN (Phase 26.85).
 */

import { LAUNCH_PROOF_CONTRADICTION } from './connected-launch-readiness-proof-types.js';
import type {
  LaunchProofContradiction,
  LaunchProofDependencyGraph,
} from './connected-launch-readiness-proof-types.js';

export function detectLaunchProofContradictions(
  graph: LaunchProofDependencyGraph,
): LaunchProofContradiction[] {
  if (graph.launchProven) return [];

  const assessed = graph.dependencies.filter((d) => d.proofLevel !== 'NOT_ASSESSED');
  if (assessed.length === 0) return [];

  const allAssessedProven = assessed.every((d) => d.proofLevel === 'PROVEN' && !d.blocksLaunch);
  if (!allAssessedProven) return [];

  return [
    {
      readOnly: true,
      kind: LAUNCH_PROOF_CONTRADICTION,
      detail: 'launchProven is false while every assessed launch dependency reports PROVEN and non-blocking',
      conflictingSources: ['connected-execution-chain-truth', 'launch-proof-dependency-graph'],
      conflictingValues: ['launchProven=false', 'all dependencies PROVEN'],
    },
  ];
}

export { LAUNCH_PROOF_CONTRADICTION };
