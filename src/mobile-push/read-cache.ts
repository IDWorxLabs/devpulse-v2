/**
 * Mobile Push Foundation — bounded read caches for validation hot paths.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';

let systemSummariesCache: ReturnType<typeof readAllSystemSummaries> | null = null;

export function readSystemSummariesForMobilePush(): ReturnType<typeof readAllSystemSummaries> {
  if (systemSummariesCache === null) {
    systemSummariesCache = readAllSystemSummaries();
  }
  return systemSummariesCache;
}

export function resetMobilePushReadCacheForTests(): void {
  systemSummariesCache = null;
}
