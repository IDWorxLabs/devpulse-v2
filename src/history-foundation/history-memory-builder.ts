/**
 * Phase 26.3 — History memory builder — bounded summaries from roadmap and project history.
 */

import { getBrainRoadmapContext } from '../command-center-brain/brain-roadmap-awareness.js';
import { buildProjectHistorySnapshot } from '../project-history-intelligence/history-timeline-builder.js';
import { HISTORY_FOUNDATION_VERSION } from './history-memory-types.js';
import { CANONICAL_LEGACY_PRODUCT_IDENTITY } from '../identity-foundation/legacy-product-identity.js';
import type { HistoryMemoryEntry, HistoryMemorySummary } from './history-memory-types.js';

function entry(
  id: string,
  category: HistoryMemoryEntry['category'],
  summary: string,
  proofLevel: HistoryMemoryEntry['proofLevel'] = 'PROVEN',
): HistoryMemoryEntry {
  return { readOnly: true, id, category, summary, proofLevel };
}

export function buildHistoryMemorySummary(query = 'default'): HistoryMemorySummary {
  const roadmap = getBrainRoadmapContext();
  const snapshot = buildProjectHistorySnapshot(query);
  const now = Date.now();

  const recentMajorMilestones: HistoryMemoryEntry[] = roadmap.completedPhases
    .slice(-6)
    .map((phase, i) =>
      entry(`milestone-${i}`, 'MILESTONE', phase, 'PROVEN'),
    );

  const recentBreakthroughs: HistoryMemoryEntry[] = [
    entry('breakthrough-rename', 'BREAKTHROUGH', 'Product renamed from DevPulse to AiDevEngine — DevPulse is now historical identity only', 'PROVEN'),
    entry('breakthrough-llm', 'BREAKTHROUGH', 'Phase 26 — Real LLM Chat Brain connected with context hydration', 'PROVEN'),
    entry('breakthrough-hydration', 'BREAKTHROUGH', 'Phase 26.2 — Question-aware context hydration and tool grounding', 'PROVEN'),
    entry('breakthrough-self-routing', 'BREAKTHROUGH', 'Phase 25.40 — Self-model routing repair for identity and capability questions', 'PROVEN'),
  ];

  const recentFixes: HistoryMemoryEntry[] = snapshot.changes
    .slice(-8)
    .map((c, i) => entry(`fix-${i}`, 'FIX', c.summary, 'PARTIAL'));

  if (!recentFixes.length) {
    recentFixes.push(
      entry('fix-foundation', 'FIX', 'Phase 26.3 — Identity, founder, product, and history memory foundation', 'PROVEN'),
      entry('fix-env', 'FIX', 'Phase 26.1 — LLM environment configuration loading via dotenv', 'PROVEN'),
    );
  }

  const recentRegressions: HistoryMemoryEntry[] = snapshot.rollbacks.slice(-4).map((r, i) =>
    entry(`regression-${i}`, 'REGRESSION', r.summary ?? 'Rollback recorded', 'PARTIAL'),
  );

  const currentBlockers: HistoryMemoryEntry[] = [
    entry('blocker-execution', 'BLOCKER', 'Autonomous build execution not fully proven — requires Founder Execution Proof', 'PARTIAL'),
    entry('blocker-session', 'BLOCKER', 'Founder Test and verification evidence session-bound until run', 'PARTIAL'),
  ];

  const savedCheckpoints: HistoryMemoryEntry[] = snapshot.checkpoints.slice(-6).map((c, i) =>
    entry(`checkpoint-${i}`, 'CHECKPOINT', c.label, 'PARTIAL'),
  );

  if (!savedCheckpoints.length) {
    savedCheckpoints.push(
      entry('checkpoint-governance', 'CHECKPOINT', 'Phase 6–9 Governance Stack validated', 'PROVEN'),
      entry('checkpoint-brain', 'CHECKPOINT', 'Phase 11 Command Center Brain foundation validated', 'PROVEN'),
    );
  }

  return {
    readOnly: true,
    version: HISTORY_FOUNDATION_VERSION,
    recentMajorMilestones,
    recentBreakthroughs,
    recentFixes,
    recentRegressions,
    currentBlockers,
    savedCheckpoints,
    builtAt: now,
  };
}

export function serializeHistoryForLlm(summary: HistoryMemorySummary): string {
  const section = (title: string, items: HistoryMemoryEntry[]) => {
    if (!items.length) return `${title}: none recorded`;
    return `${title}:\n${items.map((e) => `- [${e.proofLevel}] ${e.summary}`).join('\n')}`;
  };

  return [
    `Historical continuity: Earlier phases were completed under the ${CANONICAL_LEGACY_PRODUCT_IDENTITY.previousName} name before the product was renamed to ${CANONICAL_LEGACY_PRODUCT_IDENTITY.currentName}.`,
    '',
    section('Recent major milestones', summary.recentMajorMilestones),
    section('Recent breakthroughs', summary.recentBreakthroughs),
    section('Recent fixes', summary.recentFixes),
    section('Recent regressions', summary.recentRegressions),
    section('Current blockers', summary.currentBlockers),
    section('Saved checkpoints', summary.savedCheckpoints),
  ].join('\n\n');
}
