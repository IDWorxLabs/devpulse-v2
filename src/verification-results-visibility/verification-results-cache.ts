/**
 * In-memory cache of latest founder verification results for Command Center answers.
 */

import type { FounderTestV4Report } from '../founder-testing-mode/founder-testing-v4-types.js';
import type { VerificationResultsVisibilityAssessment } from './verification-results-visibility-types.js';
import { buildVerificationResultsFromV4Report } from './verification-results-visibility-authority.js';

let cachedResults: VerificationResultsVisibilityAssessment | null = null;

export function setLastVerificationResultsFromV4Report(report: FounderTestV4Report): VerificationResultsVisibilityAssessment {
  cachedResults = buildVerificationResultsFromV4Report(report);
  return cachedResults;
}

export function getCachedVerificationResults(): VerificationResultsVisibilityAssessment | null {
  return cachedResults;
}

export function resetVerificationResultsCacheForTests(): void {
  cachedResults = null;
}
