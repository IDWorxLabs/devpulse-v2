/** Service adapter for calendar — reusable components where */
import type { CalendarRecord } from './calendar.types';

const DEMO_CALENDAR_RECORDS: CalendarRecord[] = [
  { id: 'calendar-1', label: 'Sample Calendar record', createdAt: new Date().toISOString() },
  { id: 'calendar-2', label: 'Calendar preview entry', createdAt: new Date().toISOString() },
];

export function listCalendarRecords(): CalendarRecord[] {
  return DEMO_CALENDAR_RECORDS;
}
