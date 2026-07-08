/** Service adapter for counter — simple counter */
import type { CounterRecord } from './counter.types';

const DEMO_COUNTER_RECORDS: CounterRecord[] = [
  { id: 'counter-1', label: 'Sample Counter record', createdAt: new Date().toISOString() },
  { id: 'counter-2', label: 'Counter preview entry', createdAt: new Date().toISOString() },
];

export function listCounterRecords(): CounterRecord[] {
  return DEMO_COUNTER_RECORDS;
}
