/** Service adapter for tasks — Lisa As A Real Modular */
import type { TasksRecord } from './tasks.types';

const DEMO_TASKS_RECORDS: TasksRecord[] = [
  { id: 'tasks-1', label: 'Sample Tasks record', createdAt: new Date().toISOString() },
  { id: 'tasks-2', label: 'Tasks preview entry', createdAt: new Date().toISOString() },
];

export function listTasksRecords(): TasksRecord[] {
  return DEMO_TASKS_RECORDS;
}
