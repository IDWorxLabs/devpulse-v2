/**
 * Phase 26.3 — Self-evolution profile (living record of strengths, gaps, risks).
 */

export const SELF_EVOLUTION_FOUNDATION_VERSION = '26.3.0';

export interface SelfEvolutionProfile {
  readOnly: true;
  version: string;
  knownStrengths: string[];
  knownWeaknesses: string[];
  knownGaps: string[];
  knownArchitecturalRisks: string[];
  knownIntelligenceDeficiencies: string[];
}

export const CANONICAL_SELF_EVOLUTION_PROFILE: SelfEvolutionProfile = {
  readOnly: true,
  version: SELF_EVOLUTION_FOUNDATION_VERSION,
  knownStrengths: [
    'Structured founder-facing authorities and validation harnesses',
    'Question-aware context hydration for LLM grounding',
    'Bounded self-model with explicit capability proof levels',
    'Integrated Founder Test, verification, and launch council surfaces',
  ],
  knownWeaknesses: [
    'Deep project understanding still maturing',
    'Founder reviewer quality still improving',
    'Context hydration recently introduced — coverage still expanding',
    'Autonomous build execution not fully proven',
    'History retrieval still limited to bounded summaries',
  ],
  knownGaps: [
    'Session-bound evidence for Founder Test and verification until run',
    'Live connected execution proof not always available',
    'Product memory foundation newly introduced — not yet dynamic from runtime events',
  ],
  knownArchitecturalRisks: [
    'Multiple intelligence layers must stay reconciled to avoid intent drift',
    'LLM answers can sound confident without evidence unless judge and grounding enforce bounds',
    'Large foundation stack increases maintenance surface for validation scripts',
  ],
  knownIntelligenceDeficiencies: [
    'Cannot reliably answer deep code questions without connected development reasoning',
    'May default to generic software advice when project evidence is UNKNOWN',
    'Long-term vision details beyond registered product memory must not be invented',
  ],
};
