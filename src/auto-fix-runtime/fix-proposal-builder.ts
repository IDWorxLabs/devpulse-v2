/**
 * Fix proposal builder — planned fix proposals without application.
 */

import type { FixProposal } from './auto-fix-runtime-types.js';
import type { FailureRecord } from '../failure-visibility-engine/failure-visibility-types.js';

let proposalCounter = 0;

function nextProposalId(): string {
  proposalCounter += 1;
  return `fprop-${proposalCounter.toString().padStart(4, '0')}`;
}

export function resetFixProposalCounterForTests(): void {
  proposalCounter = 0;
}

export function buildFixProposals(query: string, failures: FailureRecord[]): FixProposal[] {
  const lower = query.toLowerCase();
  const primaryFailure = failures[0]?.title ?? 'Governance or dependency blocker';

  const proposals: FixProposal[] = [
    {
      proposalId: nextProposalId(),
      title: 'Resolve primary failure blocker',
      description: `Address visible failure: ${primaryFailure.slice(0, 80)}`,
      targetProblem: primaryFailure,
      recommended: true,
      applied: false,
      simulationOnly: true,
    },
    {
      proposalId: nextProposalId(),
      title: 'Strengthen foundation validation',
      description: 'Add or extend phase validation script coverage for affected runtime',
      targetProblem: 'Insufficient validation evidence for governed change',
      recommended: false,
      applied: false,
      simulationOnly: true,
    },
    {
      proposalId: nextProposalId(),
      title: 'Improve routing and advisory exemptions',
      description: 'Ensure Command Center routes fix questions without blocked-intent false positives',
      targetProblem: 'Advisory fix questions incorrectly blocked by execution patterns',
      recommended: false,
      applied: false,
      simulationOnly: true,
    },
    {
      proposalId: nextProposalId(),
      title: 'Link failure visibility to fix planning',
      description: 'Ensure failure records populate linkedFailureIds in auto-fix plans',
      targetProblem: 'Failure context not linked to fix proposals',
      recommended: false,
      applied: false,
      simulationOnly: true,
    },
  ];

  if (lower.includes('rollback') || lower.includes('verification')) {
    proposals.push({
      proposalId: nextProposalId(),
      title: 'Document rollback and verification gates',
      description: 'Define proof criteria and rollback steps before any future fix application',
      targetProblem: 'Missing rollback/verification plan before governed fixing',
      recommended: false,
      applied: false,
      simulationOnly: true,
    });
  }

  return proposals;
}

export function recommendedFix(proposals: FixProposal[]): FixProposal | null {
  return proposals.find((p) => p.recommended) ?? proposals[0] ?? null;
}
