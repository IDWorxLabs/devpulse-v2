/**
 * Placeholder & Template Elimination Authority V1 — Part 2: Generator Contract Consumption.
 *
 * Generic, fingerprint-based detectors for generator-invented business content — the exact shapes
 * the milestone background calls out (Sample Customer, Sample Booking, Preview Entry, Example
 * Record, Placeholder Card, Demo Item, Test Record, Fake statistics/records/users/...). Every
 * pattern here targets generic *wording shape*, never a product domain: none of them names a
 * business concept, they only recognize the structural "a generator invented this, not a human
 * business fact" shape (a template-word immediately followed by a noun phrase, or a "fake
 * <business-noun>" pairing).
 *
 * Deliberately additive and separate from `rendered-content-fingerprints.ts`'s existing,
 * already-validated `GENERIC_RENDERED_CONTENT_FINGERPRINTS` registry — this module is only ever
 * consulted by GPCA's rendered-content-collector as an extra source of `placeholderPhrasesMatched`
 * evidence (see rendered-content-collector.ts), so it can only ever add new blocking signals, never
 * remove or weaken an existing one.
 */

export interface BusinessPlaceholderFingerprintDefinition {
  readonly id: string;
  readonly pattern: RegExp;
  readonly description: string;
}

export const BUSINESS_PLACEHOLDER_RECORD_FINGERPRINTS: readonly BusinessPlaceholderFingerprintDefinition[] = [
  {
    id: 'business-placeholder-sample-noun-phrase',
    pattern: /\bsample\s+[a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,3}\b/i,
    description: 'Generator-invented "Sample <noun phrase>" business content (e.g. "Sample Customer", "Sample Booking record").',
  },
  {
    id: 'business-placeholder-demo-noun-phrase',
    pattern: /\bdemo\s+(?:data|item|items|record|records|entry|entries|customer|customers|user|users|booking|bookings|invoice|invoices|note|notes|reminder|reminders)\b/i,
    description: 'Generator-invented "Demo <business noun>" content (e.g. "Demo data", "Demo Item").',
  },
  {
    id: 'business-placeholder-preview-entry',
    pattern: /\bpreview\s+(?:entry|entries|record|records|item|items)\b/i,
    description: 'Generator-invented "Preview entry/record" business content.',
  },
  {
    id: 'business-placeholder-example-record',
    pattern: /\bexample\s+(?:record|records|feature|features|item|items|customer|customers|user|users|booking|bookings|invoice|invoices|note|notes|reminder|reminders)\b/i,
    description: 'Generator-invented "Example <business noun>" content (e.g. "Example Record", "Example Feature").',
  },
  {
    id: 'business-placeholder-template-record',
    pattern: /\btemplate\s+(?:record|records|heading|headings)\b/i,
    description: 'Generator-invented "Template heading/record" boilerplate content.',
  },
  {
    id: 'business-placeholder-test-record',
    pattern: /\btest\s+(?:record|records)\b/i,
    description: 'Generator-invented "Test record(s)" placeholder content.',
  },
  {
    id: 'business-placeholder-fake-business-noun',
    pattern: /\bfake\s+(?:statistics|stats|records?|users?|customers?|invoices?|bookings?|notes?|reminders?|cards?|dashboards?)\b/i,
    description:
      'Generator-invented "Fake <business noun>" content (fake statistics/records/users/customers/invoices/bookings/notes/reminders/cards/dashboards — Part 2 & Part 5).',
  },
];

export function matchBusinessPlaceholderFingerprints(
  text: string,
  approvedContractVocabulary: readonly string[] = [],
): BusinessPlaceholderFingerprintDefinition[] {
  const normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ');
  const approvedSampleConcept = approvedContractVocabulary.some((concept) => {
    const normalizedConcept = concept.trim().toLowerCase().replace(/\s+/g, ' ');
    return /\bsample\b/.test(normalizedConcept) && normalizedText.includes(normalizedConcept);
  });
  return BUSINESS_PLACEHOLDER_RECORD_FINGERPRINTS.filter((fp) => {
    // "Sample" is also a legitimate scientific/business entity noun. Exempt it only when the
    // exact Sample-prefixed phrase has verified canonical-contract ancestry; invented "Sample X"
    // content remains blocked by the same fingerprint.
    if (fp.id === 'business-placeholder-sample-noun-phrase' && approvedSampleConcept) return false;
    return fp.pattern.test(text);
  });
}
