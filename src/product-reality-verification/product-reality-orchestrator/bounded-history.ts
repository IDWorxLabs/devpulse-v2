/**
 * Product Reality Orchestrator — bounded evaluation history.
 */

import type { ProductRealityHistoryEntry, ProductRealityRecord } from './product-reality-types.js';
import { DEFAULT_MAX_PRODUCT_REALITY_HISTORY_SIZE } from './product-reality-types.js';

const history: ProductRealityHistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_PRODUCT_REALITY_HISTORY_SIZE;

export function recordProductRealityHistory(record: ProductRealityRecord): void {
  history.push({
    productRealityId: record.productRealityId,
    overallScore: record.overallScore,
    productRealityVerdict: record.productRealityVerdict,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getProductRealityHistory(): readonly ProductRealityHistoryEntry[] {
  return [...history];
}

export function getProductRealityHistorySize(): number {
  return history.length;
}

export function clearProductRealityHistory(): void {
  history.length = 0;
}

export function resetProductRealityHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_PRODUCT_REALITY_HISTORY_SIZE;
}
