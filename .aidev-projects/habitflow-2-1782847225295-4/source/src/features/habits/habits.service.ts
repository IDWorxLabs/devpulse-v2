/** Service adapter for habits — modern */
import type { HabitsRecord } from './habits.types';

const DEMO_HABITS_RECORDS: HabitsRecord[] = [
  { id: 'habits-1', label: 'Sample Habits record', createdAt: new Date().toISOString() },
  { id: 'habits-2', label: 'Habits preview entry', createdAt: new Date().toISOString() },
];

export function listHabitsRecords(): HabitsRecord[] {
  return DEMO_HABITS_RECORDS;
}
