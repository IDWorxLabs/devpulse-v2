/**
 * Contextual module qualification — suppresses unqualified lexical fallbacks using
 * negation, redefinition, simile, and meta-product phrasing. Domain-agnostic.
 */

import { maskNegatedProductPhrases } from '../product-faithfulness-v1/product-faithfulness-feature-extractor.js';

/**
 * Stronger exclusion mask for module minting: ban-lists, "No X", "not retail stock",
 * quoted redefinitions ("Inventory" means …), and "appear as X only in the sense of".
 */
export function maskModuleExtractionExclusions(text: string): string {
  if (!text) return text;
  return maskNegatedProductPhrases(text)
    .replace(/\bdo\s+not\s+inject\b[^.\n]*/gi, ' ')
    .replace(/\bbanned\s+fallback\s+shells?\b[^.\n]*/gi, ' ')
    .replace(/\bwithout\s+inventing\b[^.\n]*/gi, ' ')
    .replace(/\bno\s+(?:payments?|ecommerce(?:\s+\w+)?|crm(?:\s+\w+)?|generic\s+\w+(?:\s+\w+)?|retail\s+\w+)\b[^.\n]*/gi, ' ')
    .replace(/\bnot\s+(?:retail\s+)?(?:stock|inventory|crm|booking|gantt)\b[^.\n]*/gi, ' ')
    .replace(/["']\s*[\w\s-]{2,40}\s*["']\s*means\b[^.\n]*/gi, ' ')
    .replace(/\b[\w-]{2,40}\s+means\b[^.\n]*/gi, ' ')
    .replace(/\bappear\s+as\s+[\w\s-]{2,40}\s+only\s+in\s+the\s+sense\s+of\b[^.\n]*/gi, ' ')
    .replace(/\bstakeholders?\s+appear\s+as\s+contacts?\b[^.\n]*/gi, ' ')
    .replace(/\b(?:is\s+)?not\s+a\s+(?:crm|generic\s+task\s+tracker|project\s+management\s+suite|inventory\s+application|stock-sales\s+system|booking\s+system)\b[^.\n]*/gi, ' ');
}

/**
 * True when a capability keyword match is used in a non-module sense (meta, simile,
 * compound operational phrase, or exclusion residue that survived masking).
 */
export function capabilityMatchIsDisqualified(
  rawPrompt: string,
  moduleId: string,
  match: RegExpMatchArray,
): boolean {
  const idx = match.index ?? -1;
  if (idx < 0) return false;
  const windowStart = Math.max(0, idx - 100);
  const windowEnd = Math.min(rawPrompt.length, idx + match[0].length + 100);
  const window = rawPrompt.slice(windowStart, windowEnd);

  // Meta: "product modules", "feature modules", "fallback modules"
  if (
    moduleId === 'products' &&
    /\bproduct(?:s)?\s+modules?\b/i.test(window)
  ) {
    return true;
  }
  if (/\b(?:feature|fallback|banned)\s+modules?\b/i.test(window) && moduleId === 'products') {
    return true;
  }

  // Simile / redefined contacts
  if (
    moduleId === 'contacts' &&
    (/\bappear\s+as\s+contacts?\b/i.test(window) ||
      /\bcontacts?\s+only\s+in\s+the\s+sense\b/i.test(window) ||
      /\bnotified\s+parties\b/i.test(window))
  ) {
    return true;
  }

  // Operational / compound notes — not a Notes CRM module
  if (
    moduleId === 'notes' &&
    /\b(?:handoff|commander|field|operational|incident|audit)\s+notes?\b/i.test(window)
  ) {
    return true;
  }

  // Stock / inventory exclusions and redefinitions
  if (moduleId === 'stock' && /\b(?:not\s+)?retail\s+stock\b/i.test(window)) {
    return true;
  }
  if (
    moduleId === 'inventory' &&
    (/\binventory["']?\s+means\b/i.test(window) ||
      /["']inventory["']/i.test(window) ||
      /\bfailover\s+capacity\b/i.test(window) ||
      /\bno\s+ecommerce\s+inventory\b/i.test(window))
  ) {
    return true;
  }

  // Suppliers as dependency / recovery contacts — not procurement
  if (
    moduleId === 'suppliers' &&
    (/\bdependency\b/i.test(window) ||
      /\bupstream\b/i.test(window) ||
      /\bvendors?\b/i.test(window) && /\bfailure\s+impact\b/i.test(window))
  ) {
    return true;
  }

  return false;
}

/**
 * Opening "Build Name — prose description" must not be treated as a feature enumeration.
 * Comma-separated entity lists after an em-dash remain valid.
 */
export function dashClauseLooksLikeProseDescription(listBody: string): boolean {
  const trimmed = listBody.trim();
  if (!trimmed) return true;
  if (/^(?:a|an|the)\s+/i.test(trimmed) && !/,/.test(trimmed)) return true;
  if (/\b(?:production|platform|application|system|console|suite)\b/i.test(trimmed) && !/,/.test(trimmed)) {
    return true;
  }
  // Single long noun phrase without commas is product tagline, not a module list.
  if (!/,/.test(trimmed) && trimmed.split(/\s+/).length >= 6) return true;
  return false;
}

/**
 * After "manager/system/app for …", a real feature enumeration uses commas or coordinating
 * "and" between entities ("vendors, stall assignments" / "patients and providers").
 * A single noun phrase is an audience/purpose clause ("a hair salon", "small clinics") and
 * must never be minted as a product module.
 */
export function forClauseLooksLikeAudienceNotFeatureList(listBody: string): boolean {
  const trimmed = listBody.trim();
  if (!trimmed) return true;
  if (/,/.test(trimmed)) return false;
  if (/\band\b/i.test(trimmed)) return false;
  return true;
}
