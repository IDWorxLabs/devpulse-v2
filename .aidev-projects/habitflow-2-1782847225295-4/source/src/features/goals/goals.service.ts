/** Service adapter for goals — modern */
import type { GoalsRecord } from './goals.types';

const DEMO_GOALS_RECORDS: GoalsRecord[] = [
  { id: 'goals-1', label: 'Sample Goals record', createdAt: new Date().toISOString() },
  { id: 'goals-2', label: 'Goals preview entry', createdAt: new Date().toISOString() },
];

export function listGoalsRecords(): GoalsRecord[] {
  return DEMO_GOALS_RECORDS;
}
