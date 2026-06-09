/**
 * Code change proposal builder — describes proposed file changes without applying them.
 */

import type { CodeChangeProposal } from './code-generation-runtime-types.js';

let changeCounter = 0;

function nextChangeId(): string {
  changeCounter += 1;
  return `cchg-${changeCounter.toString().padStart(4, '0')}`;
}

export function resetCodeChangeProposalCounterForTests(): void {
  changeCounter = 0;
}

export function buildChangeProposals(query: string): CodeChangeProposal[] {
  const lower = query.toLowerCase();
  const modulePath =
    lower.includes('feature') ? 'src/proposed-feature/' : 'src/code-generation-runtime/';

  return [
    {
      changeId: nextChangeId(),
      targetFile: `${modulePath}types.ts`,
      changeType: 'CREATE',
      description: 'Propose new types module for governed code generation',
      rationale: 'Foundation types required before any future real generation phase',
      applied: false,
      proposalOnly: true,
    },
    {
      changeId: nextChangeId(),
      targetFile: `${modulePath}runtime.ts`,
      changeType: 'CREATE',
      description: 'Propose orchestrator module — simulation only',
      rationale: 'Orchestration separates proposal from apply in Phase 14.3',
      applied: false,
      proposalOnly: true,
    },
    {
      changeId: nextChangeId(),
      targetFile: `${modulePath}index.ts`,
      changeType: 'CREATE',
      description: 'Propose public API exports',
      rationale: 'Single export surface for Command Center integration',
      applied: false,
      proposalOnly: true,
    },
    {
      changeId: nextChangeId(),
      targetFile: 'package.json',
      changeType: 'MODIFY',
      description: 'Propose validation script entry — not applied',
      rationale: 'Future phase would add validate script after founder approval',
      applied: false,
      proposalOnly: true,
    },
  ];
}

export function extractTargetFiles(changes: CodeChangeProposal[]): string[] {
  return [...new Set(changes.map((c) => c.targetFile))];
}
