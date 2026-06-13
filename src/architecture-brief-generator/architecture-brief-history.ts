/**
 * Architecture Brief History — bounded brief history (max 32).
 */

import { MAX_ARCHITECTURE_BRIEF_HISTORY } from './architecture-brief-registry.js';
import type { ArchitectureBrief, ArchitectureBriefHistoryEntry } from './architecture-brief-types.js';

const history: ArchitectureBriefHistoryEntry[] = [];
const briefs: ArchitectureBrief[] = [];

export function resetArchitectureBriefHistoryForTests(): void {
  history.length = 0;
  briefs.length = 0;
}

export function recordArchitectureBrief(brief: ArchitectureBrief): void {
  const entry: ArchitectureBriefHistoryEntry = {
    briefId: brief.briefId,
    timestamp: brief.generatedAt,
    architectureBriefConfidence: brief.architectureBriefConfidence,
    architectureBriefQuality: brief.architectureBriefQuality,
    architectureBriefReadiness: brief.architectureBriefReadiness,
    riskCount: brief.architectureRiskAnalysis.riskCount,
  };

  history.unshift(entry);
  briefs.unshift(brief);

  if (history.length > MAX_ARCHITECTURE_BRIEF_HISTORY) {
    history.length = MAX_ARCHITECTURE_BRIEF_HISTORY;
  }
  if (briefs.length > MAX_ARCHITECTURE_BRIEF_HISTORY) {
    briefs.length = MAX_ARCHITECTURE_BRIEF_HISTORY;
  }
}

export function getArchitectureBriefHistorySize(): number {
  return history.length;
}

export function getArchitectureBriefHistory(): readonly ArchitectureBriefHistoryEntry[] {
  return [...history];
}

export function getArchitectureBriefs(): readonly ArchitectureBrief[] {
  return [...briefs];
}

export function getLatestArchitectureBrief(): ArchitectureBrief | null {
  return briefs[0] ?? null;
}
