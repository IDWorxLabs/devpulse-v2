/**
 * Phase 26.2 — Tool grounding types.
 */

import type { ContextSection, ContextSource, ContextConfidence } from '../context-hydration/context-hydration-types.js';

export interface GroundedFact {
  readOnly: true;
  source: ContextSource;
  label: string;
  lines: string[];
  proofLevel: ContextSection['proofLevel'];
}

export interface ToolGroundingResult {
  readOnly: true;
  groundedFacts: GroundedFact[];
  compressedText: string;
  factCount: number;
  overallConfidence: ContextConfidence;
  sourcesUsed: ContextSource[];
}
