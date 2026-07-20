/**
 * Generation Pipeline Compliance Authority V1 — Rendered Content Evidence Expansion V1.
 *
 * The rendered-content gate: a small, deterministic decision function over the fingerprint sets
 * `rendered-content-collector.ts` already discovered. Mirrors `generation-pipeline-compliance-
 * gate.ts`'s split between fact-finding and deciding — this module only ever decides, never scans
 * a file itself.
 *
 * Ordering matters and is deterministic: placeholder application copy is checked first (the most
 * direct signal a user is looking at unfinished template output), then generic template/reusable-
 * shell/starter fingerprints, then a rendered-contract-drift floor (visible surface text does not
 * reference the approved contract at all).
 */

import type { GpcaRenderedContentGateOutcome } from './rendered-content-types.js';

/** Rendered surface text must reference at least this % of contract-derived vocabulary to pass the drift floor. */
export const RENDERED_CONTRACT_MATCH_MINIMUM_PERCENT = 1;

export interface RenderedContentGateInput {
  readonly placeholderPhrasesMatched: readonly string[];
  readonly templateFingerprintsMatched: readonly string[];
  readonly genericShellFingerprintsMatched: readonly string[];
  readonly renderedContractMatchPercent: number;
  /** False before materialization, or when no headings/titles/text could be extracted at all. */
  readonly hasSurfaceEvidence: boolean;
}

export interface RenderedContentGateResult {
  readonly outcome: GpcaRenderedContentGateOutcome;
  readonly reasons: readonly string[];
}

export function evaluateRenderedContentGate(input: RenderedContentGateInput): RenderedContentGateResult {
  if (!input.hasSurfaceEvidence) {
    return {
      outcome: 'RENDERED_CONTENT_ALLOWED',
      reasons: ['No rendered surface evidence exists yet for this build (pre-materialization or no renderable files) — nothing to audit.'],
    };
  }

  if (input.placeholderPhrasesMatched.length > 0) {
    return {
      outcome: 'RENDERED_CONTENT_BLOCKED_PLACEHOLDER_APPLICATION',
      reasons: [
        'Rendered output contains unfinished placeholder application copy that real users would see.',
        `Matched placeholder fingerprints: ${input.placeholderPhrasesMatched.join(', ')}`,
      ],
    };
  }

  if (input.genericShellFingerprintsMatched.length > 0) {
    return {
      outcome: 'RENDERED_CONTENT_BLOCKED_GENERIC_TEMPLATE_OUTPUT',
      reasons: [
        'Rendered output matches known generic reusable-shell/onboarding/starter-dashboard/template-page fingerprints.',
        `Matched generic shell fingerprints: ${input.genericShellFingerprintsMatched.join(', ')}`,
      ],
    };
  }

  if (input.templateFingerprintsMatched.length > 0) {
    return {
      outcome: 'RENDERED_CONTENT_BLOCKED_GENERIC_TEMPLATE_OUTPUT',
      reasons: [
        'Rendered output matches generic template wording fingerprints (boilerplate copy, not contract-specific product content).',
        `Matched template fingerprints: ${input.templateFingerprintsMatched.join(', ')}`,
      ],
    };
  }

  if (input.renderedContractMatchPercent < RENDERED_CONTRACT_MATCH_MINIMUM_PERCENT) {
    return {
      outcome: 'RENDERED_CONTENT_BLOCKED_RENDERED_CONTRACT_DRIFT',
      reasons: [
        `Rendered contract match is ${input.renderedContractMatchPercent}% — none of the audited visible headings/titles/surface text references any concept from the approved canonical product contract.`,
      ],
    };
  }

  return {
    outcome: 'RENDERED_CONTENT_ALLOWED',
    reasons: [],
  };
}
