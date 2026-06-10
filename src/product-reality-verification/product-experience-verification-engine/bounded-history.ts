/**
 * Product Experience Verification Engine — bounded evaluation history.
 */

import type { ProductExperienceHistoryEntry, ProductExperienceRecord } from './product-experience-types.js';
import { DEFAULT_MAX_PRODUCT_EXPERIENCE_HISTORY_SIZE } from './product-experience-types.js';

const history: ProductExperienceHistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_PRODUCT_EXPERIENCE_HISTORY_SIZE;

export function recordProductExperienceHistory(record: ProductExperienceRecord): void {
  history.push({
    productExperienceId: record.productExperienceId,
    overallScore: record.overallScore,
    productExperienceResult: record.productExperienceResult,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getProductExperienceHistory(): readonly ProductExperienceHistoryEntry[] {
  return [...history];
}

export function getProductExperienceHistorySize(): number {
  return history.length;
}

export function clearProductExperienceHistory(): void {
  history.length = 0;
}

export function resetProductExperienceHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_PRODUCT_EXPERIENCE_HISTORY_SIZE;
}
