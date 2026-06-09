/**
 * Founder Inbox Foundation — bounded read caches for validation hot paths.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';

let systemSummariesCache: ReturnType<typeof readAllSystemSummaries> | null = null;

export function readSystemSummariesForFounderInbox(): ReturnType<typeof readAllSystemSummaries> {
  if (systemSummariesCache === null) {
    systemSummariesCache = readAllSystemSummaries();
  }
  return systemSummariesCache;
}

export function resetFounderInboxReadCacheForTests(): void {
  systemSummariesCache = null;
}
