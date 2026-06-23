/**
 * Launch Blocker Board V1 — in-memory history (read-only).
 */

import type { LaunchBlockerBoardReport } from './launch-blocker-board-types.js';
import { MAX_LAUNCH_BLOCKER_BOARD_HISTORY } from './launch-blocker-board-registry.js';

const history: LaunchBlockerBoardReport[] = [];

export function recordLaunchBlockerBoardReport(report: LaunchBlockerBoardReport): void {
  history.unshift(report);
  if (history.length > MAX_LAUNCH_BLOCKER_BOARD_HISTORY) {
    history.length = MAX_LAUNCH_BLOCKER_BOARD_HISTORY;
  }
}

export function getLaunchBlockerBoardHistory(): readonly LaunchBlockerBoardReport[] {
  return history;
}

export function getLaunchBlockerBoardHistorySize(): number {
  return history.length;
}

export function resetLaunchBlockerBoardHistoryForTests(): void {
  history.length = 0;
}
