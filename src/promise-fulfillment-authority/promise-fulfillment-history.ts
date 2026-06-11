/**
 * Promise Fulfillment History — bounded assessment retention.
 */

import { MAX_PROMISE_HISTORY } from './promise-fulfillment-bounds.js';
import type { PromiseFulfillmentAssessment } from './promise-fulfillment-types.js';

const history: PromiseFulfillmentAssessment[] = [];

export function resetPromiseFulfillmentHistoryForTests(): void {
  history.length = 0;
}

export function recordPromiseFulfillmentAssessment(assessment: PromiseFulfillmentAssessment): void {
  history.push(assessment);
  while (history.length > MAX_PROMISE_HISTORY) {
    history.shift();
  }
}

export function getPromiseFulfillmentHistorySize(): number {
  return history.length;
}

export function getLatestPromiseFulfillmentAssessment(): PromiseFulfillmentAssessment | null {
  return history.at(-1) ?? null;
}
