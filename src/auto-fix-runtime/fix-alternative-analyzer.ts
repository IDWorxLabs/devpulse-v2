/**
 * Fix alternative analyzer — ranks alternative fixes without applying any.
 */

import type { FixAlternative } from './auto-fix-runtime-types.js';

let alternativeCounter = 0;

function nextAlternativeId(): string {
  alternativeCounter += 1;
  return `falt-${alternativeCounter.toString().padStart(4, '0')}`;
}

export function resetFixAlternativeCounterForTests(): void {
  alternativeCounter = 0;
}

export function analyzeFixAlternatives(query: string): FixAlternative[] {
  const lower = query.toLowerCase();

  const alternatives: FixAlternative[] = [
    {
      alternativeId: nextAlternativeId(),
      title: 'Incremental foundation extension',
      description: 'Extend existing runtime module with minimal scope — follow Phase 14.x patterns',
      tradeoff: 'Lower risk, slower coverage',
      rank: 1,
      simulationOnly: true,
    },
    {
      alternativeId: nextAlternativeId(),
      title: 'Defer fix until approval gate',
      description: 'Document fix plan only; wait for founder approval before any governed application',
      tradeoff: 'Safest — no changes until gates pass',
      rank: 2,
      simulationOnly: true,
    },
    {
      alternativeId: nextAlternativeId(),
      title: 'Rollback-first remediation',
      description: 'Revert to last known-good validation state before proposing new fix',
      tradeoff: 'May lose recent advisory progress',
      rank: 3,
      simulationOnly: true,
    },
    {
      alternativeId: nextAlternativeId(),
      title: 'Cross-runtime linkage repair',
      description: 'Fix broken links between failure, testing, code generation, and execution packets',
      tradeoff: 'Requires coordinated multi-module planning',
      rank: 4,
      simulationOnly: true,
    },
  ];

  if (lower.includes('alternative')) {
    alternatives.push({
      alternativeId: nextAlternativeId(),
      title: 'Manual founder-guided fix',
      description: 'Founder applies fix outside auto-fix runtime with evidence ledger entry',
      tradeoff: 'Human-in-the-loop — not autonomous',
      rank: 5,
      simulationOnly: true,
    });
  }

  return alternatives.sort((a, b) => a.rank - b.rank);
}
