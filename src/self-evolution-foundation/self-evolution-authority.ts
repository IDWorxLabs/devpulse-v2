/**
 * Phase 26.3 — Self-evolution foundation authority (read-only).
 */

import { CANONICAL_SELF_EVOLUTION_PROFILE } from './self-evolution-profile.js';
import type { SelfEvolutionProfile } from './self-evolution-profile.js';

export interface SelfEvolutionFoundationSnapshot {
  readOnly: true;
  profile: SelfEvolutionProfile;
  loadedAt: number;
}

export function getSelfEvolutionProfile(): SelfEvolutionProfile {
  return CANONICAL_SELF_EVOLUTION_PROFILE;
}

export function loadSelfEvolutionFoundation(): SelfEvolutionFoundationSnapshot {
  return {
    readOnly: true,
    profile: getSelfEvolutionProfile(),
    loadedAt: Date.now(),
  };
}

export function serializeSelfEvolutionForLlm(profile: SelfEvolutionProfile = getSelfEvolutionProfile()): string {
  const list = (title: string, items: string[]) =>
    `${title}:\n${items.map((i) => `- ${i}`).join('\n')}`;

  return [
    list('Known strengths', profile.knownStrengths),
    list('Known weaknesses', profile.knownWeaknesses),
    list('Known gaps', profile.knownGaps),
    list('Known architectural risks', profile.knownArchitecturalRisks),
    list('Known intelligence deficiencies', profile.knownIntelligenceDeficiencies),
  ].join('\n\n');
}
