/**
 * Phase 26.2 — Tool grounding orchestrator — compress evidence for LLM.
 */

import type { HydratedContext } from '../context-hydration/context-hydration-types.js';
import type { GroundedFact, ToolGroundingResult } from './tool-grounding-types.js';

const SOURCE_LABELS: Record<string, string> = {
  IDENTITY: 'Identity',
  SELF_MODEL: 'Self Model',
  CAPABILITY_BOUNDARIES: 'Capability Boundaries',
  PROJECT_VAULT: 'Project Vault',
  FOUNDER_TEST: 'Founder Test',
  EXECUTION_PROOF: 'Execution Proof',
  VERIFICATION: 'Verification',
  WORKSPACE: 'Workspace',
  PROJECT_HISTORY: 'Project History',
  LAUNCH_COUNCIL: 'Launch Council',
};

function groupSectionsBySource(hydrated: HydratedContext): GroundedFact[] {
  const bySource = new Map<string, GroundedFact>();

  for (const section of hydrated.sections) {
    const key = section.source;
    const existing = bySource.get(key);
    const line = `${section.label} [${section.proofLevel}]: ${section.content}`;
    if (existing) {
      existing.lines.push(line);
    } else {
      bySource.set(key, {
        readOnly: true,
        source: section.source,
        label: SOURCE_LABELS[section.source] ?? section.source,
        lines: [line],
        proofLevel: section.proofLevel,
      });
    }
  }

  return [...bySource.values()];
}

export function groundHydratedContext(hydrated: HydratedContext): ToolGroundingResult {
  const groundedFacts = groupSectionsBySource(hydrated);
  const blocks: string[] = [];

  for (const fact of groundedFacts) {
    blocks.push(`${fact.label}:`);
    for (const line of fact.lines.slice(0, 6)) {
      blocks.push(`- ${line}`);
    }
    blocks.push('');
  }

  if (hydrated.projectContext) {
    blocks.push('Project context summary:', hydrated.projectContext, '');
  }
  if (hydrated.executionContext) {
    blocks.push('Execution context summary:', hydrated.executionContext, '');
  }
  if (hydrated.verificationContext) {
    blocks.push('Verification context summary:', hydrated.verificationContext, '');
  }
  if (hydrated.launchContext) {
    blocks.push('Launch context summary:', hydrated.launchContext, '');
  }
  if (hydrated.historyContext) {
    blocks.push('History context summary:', hydrated.historyContext, '');
  }

  blocks.push('Rules: Use UNKNOWN when proofLevel is UNKNOWN. Never invent proof.');

  return {
    readOnly: true,
    groundedFacts,
    compressedText: blocks.join('\n').trim(),
    factCount: hydrated.hydratedFactCount,
    overallConfidence: hydrated.overallConfidence,
    sourcesUsed: hydrated.sourcesUsed,
  };
}

export function formatGroundedFactsForDisplay(sources: string[]): string {
  return sources.map((s) => SOURCE_LABELS[s] ?? s).join(', ');
}
