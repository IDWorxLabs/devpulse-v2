/**
 * Customer Value Authority History — bounded assessment retention.
 */

import { MAX_CUSTOMER_VALUE_HISTORY } from './customer-value-bounds.js';
import type { CustomerValueAssessment } from './customer-value-types.js';

const history: CustomerValueAssessment[] = [];

export function resetCustomerValueHistoryForTests(): void {
  history.length = 0;
}

export function recordCustomerValueAssessment(assessment: CustomerValueAssessment): void {
  history.push(assessment);
  while (history.length > MAX_CUSTOMER_VALUE_HISTORY) {
    history.shift();
  }
}

export function getCustomerValueHistorySize(): number {
  return history.length;
}

export function getLatestCustomerValueAssessment(): CustomerValueAssessment | null {
  return history.at(-1) ?? null;
}
