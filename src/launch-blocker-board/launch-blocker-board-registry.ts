/**
 * Launch Blocker Board V1 — registry and strategy reset rules.
 */

import type { LaunchBlockerBucket, LaunchBlockerDisposition } from './launch-blocker-board-types.js';

export const LAUNCH_BLOCKER_BOARD_PASS = 'LAUNCH_BLOCKER_BOARD_PASS';

export const LAUNCH_BLOCKER_BOARD_PHASE =
  'Founder Test Strategy Reset — Launch Blocker Board V1';

export const LAUNCH_BLOCKER_BOARD_CORE_QUESTION =
  'What must the founder fix before customers can use AiDevEngine — and what is only testing noise?';

export const LAUNCH_BLOCKER_BOARD_REPORT_TITLE = 'Launch Blocker Board';

export const LAUNCH_BLOCKER_BOARD_CACHE_KEY_PREFIX = 'launch-blocker-board-v1';

export const MAX_LAUNCH_BLOCKER_BOARD_HISTORY = 16;

export const MAX_TOP_LAUNCH_BLOCKERS = 8;

export const LAUNCH_BLOCKER_BUCKETS: readonly LaunchBlockerBucket[] = [
  'REAL_PRODUCT_GAP',
  'CLAIM_WORDING_GAP',
  'UI_UX_GAP',
  'FOUNDER_TEST_NOISE',
] as const;

/** Only these failure modes justify new Founder Test repair phases. */
export const FOUNDER_TEST_REPAIR_PHASE_TRIGGERS = [
  'Typecheck fails',
  'Founder Test cannot generate a report',
  'Runtime crashes',
  'Result fetch fails',
  'Data corruption occurs',
] as const;

export const STRATEGY_RESET_RULE =
  'No more Founder Test repair phases unless typecheck fails, report generation fails, runtime crashes, result fetch fails, or data corruption occurs. Everything else becomes a Launch Blocker Board item.';

export const CANONICAL_LAUNCH_BLOCKER_IDS = [
  'connected-execution-proof',
  'live-preview-proof',
  'mobile-runtime-proof',
  'promise-claim-mismatch',
  'copy-report-ui',
] as const;

export const DEFAULT_DISPOSITION_BY_BUCKET: Record<LaunchBlockerBucket, LaunchBlockerDisposition> = {
  REAL_PRODUCT_GAP: 'KEEP',
  CLAIM_WORDING_GAP: 'KEEP',
  UI_UX_GAP: 'KEEP',
  FOUNDER_TEST_NOISE: 'IGNORE',
};
