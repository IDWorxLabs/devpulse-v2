/**
 * Repository Typecheck Reality — bounded assessment history.
 */

import type { RepositoryTypecheckAssessment } from './repository-typecheck-reality-types.js';
import { MAX_TYPECHECK_HISTORY } from './repository-typecheck-reality-bounds.js';

const history: RepositoryTypecheckAssessment[] = [];
let latestBaseline: RepositoryTypecheckAssessment | null = null;

export function resetRepositoryTypecheckHistoryForTests(): void {
  history.length = 0;
  latestBaseline = null;
}

export function recordRepositoryTypecheckAssessment(assessment: RepositoryTypecheckAssessment): void {
  history.push(assessment);
  while (history.length > MAX_TYPECHECK_HISTORY) {
    history.shift();
  }
  latestBaseline = assessment;
}

export function getLatestRepositoryTypecheckBaseline(): RepositoryTypecheckAssessment | null {
  return latestBaseline;
}

export function getRepositoryTypecheckHistorySize(): number {
  return history.length;
}
