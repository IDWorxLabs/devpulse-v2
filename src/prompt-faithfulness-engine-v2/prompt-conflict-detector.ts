/**
 * Prompt Faithfulness Engine V2 — conflict detection.
 */

import type { PromptConflict, PromptEvidenceContract } from './prompt-faithfulness-v2-types.js';

let conflictCounter = 0;

export function resetPromptConflictDetectorForTests(): void {
  conflictCounter = 0;
}

const CONFLICT_PAIRS: Array<{
  patternA: RegExp;
  patternB: RegExp;
  summary: string;
  interpretations: string[];
}> = [
  {
    patternA: /\boffline[\s-]?only\b/i,
    patternB: /\breal[\s-]?time\b.*\bcloud\b|\bcloud sync/i,
    summary: 'Offline-only conflicts with real-time cloud synchronization',
    interpretations: ['Offline-first with background sync', 'Cloud-primary with offline cache', 'Clarify connectivity requirements'],
  },
  {
    patternA: /\bsingle[\s-]?screen\b/i,
    patternB: /\bmulti[\s-]?page\b|\bdashboard\b.*\btabs\b/i,
    summary: 'Single screen conflicts with multi-page navigation',
    interpretations: ['Single screen with modals', 'Multi-page SPA', 'Clarify navigation scope'],
  },
  {
    patternA: /\bno auth\b|\banonymous\b/i,
    patternB: /\blogin\b|\bauthentication\b|\buser account/i,
    summary: 'Anonymous access conflicts with authentication requirement',
    interpretations: ['Optional auth', 'Mandatory auth', 'Clarify user identity model'],
  },
  {
    patternA: /\bdesktop[\s-]?only\b/i,
    patternB: /\bmobile[\s-]?first\b|\bandroid[\s-]?first\b/i,
    summary: 'Desktop-only conflicts with mobile-first requirement',
    interpretations: ['Responsive both platforms', 'Mobile primary', 'Clarify platform priority'],
  },
];

export function detectPromptConflicts(contract: PromptEvidenceContract): PromptConflict[] {
  const conflicts: PromptConflict[] = [];
  const fullText = contract.rawPrompt;

  for (const pair of CONFLICT_PAIRS) {
    if (pair.patternA.test(fullText) && pair.patternB.test(fullText)) {
      conflictCounter += 1;
      const affectedEvidence = contract.requirements
        .filter((r) => pair.patternA.test(r.originalSentence) || pair.patternB.test(r.originalSentence))
        .map((r) => r.evidenceId);

      conflicts.push({
        readOnly: true,
        conflictId: `conflict-${conflictCounter}`,
        summary: pair.summary,
        conflictingEvidence: affectedEvidence,
        affectedRequirementIds: [],
        interpretations: pair.interpretations,
        confidence: 0.95,
        requiresClarification: true,
      });
    }
  }

  return conflicts;
}

export function hasBlockingConflicts(conflicts: readonly PromptConflict[]): boolean {
  return conflicts.some((c) => c.requiresClarification && c.confidence >= 0.9);
}
