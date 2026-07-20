/**
 * Infrastructure vs Product Boundary Authority V1 — Phase 2/3 business-content signal detection.
 *
 * Reuses (never duplicates, never modifies) GPCA's own Rendered Content Evidence Expansion V1
 * extraction primitives — the exact same functions that already read real generated React/TSX
 * source as the framework's rendered tree. This module adds nothing new to *what* counts as
 * rendered business content; it only asks a different question of the same evidence: does this file
 * carry ANY of it at all? Phase 3's boundary rule is exactly this — a file is only safe as pure
 * infrastructure when it contains zero hardcoded business identity, zero product terminology, zero
 * hardcoded headings/navigation/copy, no matter how small.
 */

import {
  extractAllVisibleTextNodes,
  extractButtonLabels,
  extractHeadings,
  extractNavigationLabels,
  matchRenderedFingerprints,
  referencesContractVocabulary,
} from '../generation-pipeline-compliance-authority-v1/rendered-content-fingerprints.js';
import type { BoundarySignalMatch } from './infrastructure-product-boundary-types.js';

export interface BusinessContentSignalResult {
  readonly signals: readonly BoundarySignalMatch[];
  readonly hasAny: boolean;
  readonly contractReferenced: boolean;
}

const PATH_OR_URL_PATTERN = /^(?:https?:\/\/|\.{1,2}\/|\/)/;
const FREE_TEXT_LITERAL_PATTERN = /(['"`])((?:[A-Za-z][A-Za-z'-]*\s+){1,}[A-Za-z][A-Za-z'-]*)\1/g;

/**
 * Structural attribute values (className / data-* / role / aria-*) are styling and a11y wiring,
 * not product copy. Strip them before free-text scanning so multi-token CSS class lists cannot
 * false-positive as BUSINESS_COPY and flip a pure lifecycle stub into MIXED.
 */
const STRUCTURAL_ATTRIBUTE_VALUE_PATTERN =
  /\b(?:className|class|id|role|aria-[\w-]+|data-[\w-]+)\s*=\s*(?:\{`[^`]*`\}|(['"`])(?:(?!\1).)*\1)/gi;

/**
 * Extracts quoted string literals that read like a real sentence/phrase (two or more words), the
 * generic proxy for "hardcoded business copy" in non-JSX-rendered contexts (e.g. a plain object
 * literal building nav items, or a `.ts` module with no markup at all). Import paths, URLs, and
 * single-word technical tokens are excluded — this only ever matches literal, human-readable phrases.
 */
function extractFreeTextStringLiterals(content: string): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null;
  const scanned = content.replace(STRUCTURAL_ATTRIBUTE_VALUE_PATTERN, ' ');
  const re = new RegExp(FREE_TEXT_LITERAL_PATTERN);
  while ((match = re.exec(scanned))) {
    const text = match[2].trim();
    if (text.length < 4 || text.length > 160) continue;
    if (PATH_OR_URL_PATTERN.test(text)) continue;
    results.push(text);
  }
  return results;
}

/**
 * Detects whether a file's real content carries ANY rendered/hardcoded business-facing text —
 * headings, button labels, navigation labels, static visible text, or free-text string literals.
 * Every extraction call below is the same real-content primitive GPCA's Rendered Content Evidence
 * Expansion V1 already uses; this module only aggregates their outputs into one boolean signal.
 */
export function detectBusinessContentSignals(
  content: string,
  contractVocabulary: readonly string[],
): BusinessContentSignalResult {
  const signals: BoundarySignalMatch[] = [];

  const headings = extractHeadings(content);
  const visibleText = extractAllVisibleTextNodes(content);
  const buttonLabels = extractButtonLabels(content);
  const navLabels = extractNavigationLabels(content);
  const freeTextLiterals = extractFreeTextStringLiterals(content);

  for (const sample of headings) signals.push({ kind: 'HEADING', evidence: sample });
  for (const sample of buttonLabels) signals.push({ kind: 'BUTTON', evidence: sample });
  for (const sample of navLabels) signals.push({ kind: 'BUSINESS_NAVIGATION', evidence: sample });
  for (const sample of visibleText) {
    if (!headings.includes(sample) && !buttonLabels.includes(sample)) {
      signals.push({ kind: 'BUSINESS_COPY', evidence: sample });
    }
  }
  for (const sample of freeTextLiterals) {
    if (!visibleText.includes(sample) && !navLabels.includes(sample)) {
      signals.push({ kind: 'BUSINESS_COPY', evidence: sample });
    }
  }

  const allTextSamples = [...headings, ...visibleText, ...buttonLabels, ...navLabels, ...freeTextLiterals];

  let contractReferenced = false;
  for (const sample of allTextSamples) {
    if (referencesContractVocabulary(sample, contractVocabulary)) {
      contractReferenced = true;
      break;
    }
  }

  for (const sample of allTextSamples) {
    for (const fingerprint of matchRenderedFingerprints(sample)) {
      signals.push({ kind: `GENERIC_TEMPLATE_FINGERPRINT:${fingerprint.category}`, evidence: `"${sample}" :: ${fingerprint.id}` });
    }
  }

  return { signals, hasAny: signals.length > 0, contractReferenced };
}
