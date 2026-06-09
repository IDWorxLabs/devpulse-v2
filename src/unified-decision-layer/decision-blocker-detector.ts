/**
 * Decision blocker detector — identifies what blocks each option and overall progress.
 */

import type { DecisionContext, DecisionOption } from './decision-types.js';

export interface BlockerAnalysis {
  optionBlockers: Map<string, string[]>;
  globalBlockers: string[];
  blockerCount: number;
  primaryBlocker: string | null;
  summary: string;
}

const UNIMPLEMENTED_REASONING_BLOCKERS = [
  'Development Reasoning not implemented',
  'Debugging Reasoning not implemented',
  'Execution Reasoning not implemented',
] as const;

export function detectOptionBlockers(option: DecisionOption, context: DecisionContext): string[] {
  const blockers = [...option.blockers];

  if (option.title.toLowerCase().includes('execution') && !blockers.some((b) => b.includes('Execution'))) {
    for (const b of UNIMPLEMENTED_REASONING_BLOCKERS) {
      if (!blockers.includes(b)) blockers.push(b);
    }
  }

  if (option.title.toLowerCase().includes('cloud') && context.blockedItems.length > 0) {
    for (const item of context.blockedItems) {
      if (item.toLowerCase().includes('cloud') && !blockers.includes(item)) {
        blockers.push(item);
      }
    }
  }

  if (option.category === 'DO_NOT_BUILD_YET' || option.category === 'BLOCKED') {
    for (const cap of context.missingCapabilities.slice(0, 3)) {
      const label = `${cap} not implemented or not connected`;
      if (!blockers.includes(label)) blockers.push(label);
    }
  }

  return [...new Set(blockers)];
}

export function analyzeBlockers(
  options: DecisionOption[],
  context: DecisionContext,
): BlockerAnalysis {
  const optionBlockers = new Map<string, string[]>();
  const globalSet = new Set<string>();

  for (const option of options) {
    const blockers = detectOptionBlockers(option, context);
    optionBlockers.set(option.decisionId, blockers);
    for (const b of blockers) globalSet.add(b);
  }

  for (const item of context.blockedItems) {
    globalSet.add(item);
  }

  for (const item of context.timelineBlockers) {
    globalSet.add(item);
  }

  for (const item of context.dependencyBlockers) {
    globalSet.add(item);
  }

  const globalBlockers = [...globalSet];
  const primaryBlocker = globalBlockers[0] ?? null;

  return {
    optionBlockers,
    globalBlockers,
    blockerCount: globalBlockers.length,
    primaryBlocker,
    summary:
      globalBlockers.length > 0
        ? `${globalBlockers.length} blocker(s) registered — primary: ${primaryBlocker}`
        : 'No structural blockers detected for advisory decision layer.',
  };
}

export function blockersForOption(analysis: BlockerAnalysis, option: DecisionOption): string[] {
  return analysis.optionBlockers.get(option.decisionId) ?? option.blockers;
}
