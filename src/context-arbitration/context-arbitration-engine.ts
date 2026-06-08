/**
 * Rule-based context arbitration — no AI, LLM, execution, or answer generation.
 */

import type { IntentType } from '../intent-architecture/types.js';
import { mapIntentToContextPriority } from './context-intent-bridge.js';
import type {
  ContextArbitrationResult,
  ContextCandidate,
  ContextPriority,
} from './types.js';

const PRIORITY_RANK: Record<ContextPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  IGNORE: 3,
};

function createArbitrationId(): string {
  return `arb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneCandidate(candidate: ContextCandidate): ContextCandidate {
  return { ...candidate };
}

export function prioritizeContext(candidates: ContextCandidate[]): ContextCandidate[] {
  return [...candidates].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );
}

export function filterContext(candidates: ContextCandidate[]): ContextCandidate[] {
  return candidates.filter((c) => c.priority !== 'IGNORE');
}

export interface ArbitrateContextOptions {
  intentType?: IntentType;
}

export function arbitrateContext(
  candidates: ContextCandidate[],
  options: ArbitrateContextOptions = {},
): ContextArbitrationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (candidates.length === 0) {
    errors.push('No context candidates supplied for arbitration.');
  }

  warnings.push(
    'Context Arbitration selects context only — it does not answer, execute, or generate code.',
  );

  let adjusted = candidates.map(cloneCandidate);

  if (options.intentType) {
    adjusted = adjusted.map((candidate) => ({
      ...candidate,
      priority: mapIntentToContextPriority(options.intentType!, candidate.source),
    }));
  }

  const prioritized = prioritizeContext(adjusted);
  const selectedContext: ContextCandidate[] = [];
  const ignoredContext: ContextCandidate[] = [];

  for (const candidate of prioritized) {
    if (candidate.priority === 'IGNORE' || candidate.priority === 'LOW') {
      ignoredContext.push(cloneCandidate(candidate));
    } else {
      selectedContext.push(cloneCandidate(candidate));
    }
  }

  if (selectedContext.length === 0 && candidates.length > 0) {
    warnings.push('All candidates were deprioritized — review intent mapping or candidate relevance.');
  }

  return {
    arbitrationId: createArbitrationId(),
    createdAt: Date.now(),
    selectedContext,
    ignoredContext,
    warnings,
    errors,
  };
}

export function summarizeArbitration(result: ContextArbitrationResult): string {
  const selected = result.selectedContext.map((c) => `${c.source}(${c.priority})`).join(', ');
  const ignored = result.ignoredContext.map((c) => `${c.source}(${c.priority})`).join(', ');
  return (
    `Arbitration ${result.arbitrationId}: selected=[${selected || 'none'}] ` +
    `ignored=[${ignored || 'none'}]`
  );
}

export function createContextCandidate(
  source: ContextCandidate['source'],
  label: string,
  summary: string,
  priority: ContextPriority = 'MEDIUM',
): ContextCandidate {
  return {
    contextId: `ctx-${source.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    source,
    label,
    summary,
    priority,
    createdAt: Date.now(),
  };
}

export function buildDefaultCandidates(): ContextCandidate[] {
  return [
    createContextCandidate('INTENT_ARCHITECTURE', 'Intent summary', 'Latest structured intent'),
    createContextCandidate('CENTRAL_BRAIN', 'System awareness', 'Observed system state summaries'),
    createContextCandidate('PROJECT_VAULT', 'Project memory', 'Active project records and facts'),
    createContextCandidate('TIMELINE_LEDGER', 'Event history', 'Chronological timeline events'),
    createContextCandidate('EVIDENCE_REGISTRY', 'Proof references', 'Stored evidence records'),
    createContextCandidate('TRUST_ENGINE', 'Trust observation', 'Latest trust evaluation snapshot'),
  ];
}
