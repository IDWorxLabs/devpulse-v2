/**
 * Code artifact model — in-memory proposal artifacts only.
 */

import type { CodeArtifactProposal } from './code-generation-runtime-types.js';

let artifactCounter = 0;

function nextArtifactId(): string {
  artifactCounter += 1;
  return `cart-${artifactCounter.toString().padStart(4, '0')}`;
}

export function resetCodeArtifactCounterForTests(): void {
  artifactCounter = 0;
}

export function buildArtifactProposals(query: string): CodeArtifactProposal[] {
  const lower = query.toLowerCase();
  const feature = lower.includes('feature') ? 'requested feature' : 'governed capability';

  return [
    {
      artifactId: nextArtifactId(),
      name: 'types.ts',
      description: `Type definitions for ${feature} — proposal only`,
      language: 'typescript',
      inMemoryOnly: true,
      proposedContentSummary: 'Interfaces and types for generation plan, artifacts, and validation — not written to disk',
      proposalOnly: true,
    },
    {
      artifactId: nextArtifactId(),
      name: 'runtime.ts',
      description: `Orchestrator module for ${feature} — simulation stub`,
      language: 'typescript',
      inMemoryOnly: true,
      proposedContentSummary: 'Advisory orchestration functions returning proposals — no file system access',
      proposalOnly: true,
    },
    {
      artifactId: nextArtifactId(),
      name: 'index.ts',
      description: 'Public API exports for proposed module',
      language: 'typescript',
      inMemoryOnly: true,
      proposedContentSummary: 'Export surface for code generation runtime foundation — proposal descriptor only',
      proposalOnly: true,
    },
  ];
}
