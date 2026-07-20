/**
 * Placeholder & Template Elimination Authority V1 — Part 3: Infrastructure Exception.
 *
 * A small, generic, universally-applicable set of UI-chrome words every real application needs
 * regardless of product domain — loading/navigation/dialog affordances. None of these carries
 * business identity; none is ever a product concept. This is deliberately a short, closed list of
 * generic single words/short phrases, never a per-application allowlist.
 */

export const INFRASTRUCTURE_CONTENT_LEXICON: readonly string[] = [
  'loading',
  'back',
  'retry',
  'next',
  'previous',
  'search',
  'menu',
  'navigation',
  'cancel',
  'confirm',
  'close',
  'ok',
  'yes',
  'no',
  'continue',
  'skip',
  'done',
  'save',
  'saving',
];

const INFRASTRUCTURE_PHRASE_PATTERN = /^(?:loading|saving|retrying|submitting)(?:\s*\.{3}|\s*…)?$/i;

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Whether a rendered text fragment is pure infrastructure UI chrome — exact (case-insensitive)
 * membership in the generic lexicon above, or one of the generic "Loading…"-style progress-phrase
 * shapes. Never a substring/partial match (so it can never accidentally swallow real business
 * copy that merely contains one of these words).
 */
export function isInfrastructureContentText(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized) return false;
  if (INFRASTRUCTURE_CONTENT_LEXICON.includes(normalized)) return true;
  return INFRASTRUCTURE_PHRASE_PATTERN.test(normalized);
}
