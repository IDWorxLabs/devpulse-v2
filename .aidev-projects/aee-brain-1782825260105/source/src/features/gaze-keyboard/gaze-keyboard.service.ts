/** Service adapter for gaze-keyboard — LISA — Locked In Syndrome App */
import type { GazeKeyboardRecord } from './gaze-keyboard.types';

const DEMO_GAZE_KEYBOARD_RECORDS: GazeKeyboardRecord[] = [
  { id: 'gaze-keyboard-1', label: 'Sample Gaze Keyboard record', createdAt: new Date().toISOString() },
  { id: 'gaze-keyboard-2', label: 'Gaze Keyboard preview entry', createdAt: new Date().toISOString() },
];

export function listGazeKeyboardRecords(): GazeKeyboardRecord[] {
  return DEMO_GAZE_KEYBOARD_RECORDS;
}
