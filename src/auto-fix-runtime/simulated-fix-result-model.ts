/**
 * Simulated fix result model — models outcomes without applying fixes.
 */

import type { FixProposal, SimulatedFixResult } from './auto-fix-runtime-types.js';

let resultCounter = 0;

function nextResultId(): string {
  resultCounter += 1;
  return `fres-${resultCounter.toString().padStart(4, '0')}`;
}

export function resetSimulatedFixResultCounterForTests(): void {
  resultCounter = 0;
}

export function buildSimulatedFixResults(proposals: FixProposal[], query: string): SimulatedFixResult[] {
  const lower = query.toLowerCase();
  const wantsFailure = lower.includes('blocking') || lower.includes('fail');

  return proposals.map((proposal, index) => {
    let status: SimulatedFixResult['status'] = 'NOT_APPLIED';
    let summary = 'Simulated — fix not applied; planning only';

    if (index === 0 && proposal.recommended) {
      status = 'SUCCESS';
      summary = `Simulated SUCCESS — ${proposal.title} would resolve target problem if applied in future governed phase`;
    } else if (index === 1 || (wantsFailure && index === 2)) {
      status = 'FAIL';
      summary = `Simulated FAIL — ${proposal.title} blocked by Phase 14.5 no-application guard`;
    } else {
      status = 'SKIPPED';
      summary = `Simulated SKIPPED — ${proposal.title} deferred until approval gates pass`;
    }

    return {
      resultId: nextResultId(),
      proposalId: proposal.proposalId,
      title: proposal.title,
      status,
      summary,
      evidenceNote: 'No fixes applied — simulated result for visibility only',
      applied: false,
      simulationOnly: true,
    };
  });
}

export function simulatedFailedFixResults(results: SimulatedFixResult[]): SimulatedFixResult[] {
  return results.filter((r) => r.status === 'FAIL');
}
