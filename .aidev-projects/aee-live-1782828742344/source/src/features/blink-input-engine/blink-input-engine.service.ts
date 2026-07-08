/** Service adapter for blink-input-engine — LISA — Locked In Syndrome App */
import type { BlinkInputEngineRecord } from './blink-input-engine.types';

const DEMO_BLINK_INPUT_ENGINE_RECORDS: BlinkInputEngineRecord[] = [
  { id: 'blink-input-engine-1', label: 'Sample Blink Input Engine record', createdAt: new Date().toISOString() },
  { id: 'blink-input-engine-2', label: 'Blink Input Engine preview entry', createdAt: new Date().toISOString() },
];

export function listBlinkInputEngineRecords(): BlinkInputEngineRecord[] {
  return DEMO_BLINK_INPUT_ENGINE_RECORDS;
}
