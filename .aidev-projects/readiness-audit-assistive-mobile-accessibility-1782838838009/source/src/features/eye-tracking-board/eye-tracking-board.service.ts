/** Service adapter for eye-tracking-board — LISA — Locked In Syndrome App */
import type { EyeTrackingBoardRecord } from './eye-tracking-board.types';

const DEMO_EYE_TRACKING_BOARD_RECORDS: EyeTrackingBoardRecord[] = [
  { id: 'eye-tracking-board-1', label: 'Sample Eye Tracking Board record', createdAt: new Date().toISOString() },
  { id: 'eye-tracking-board-2', label: 'Eye Tracking Board preview entry', createdAt: new Date().toISOString() },
];

export function listEyeTrackingBoardRecords(): EyeTrackingBoardRecord[] {
  return DEMO_EYE_TRACKING_BOARD_RECORDS;
}
