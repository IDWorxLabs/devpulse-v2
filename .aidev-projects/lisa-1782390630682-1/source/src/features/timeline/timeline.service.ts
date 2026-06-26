/** Service adapter for timeline — Lisa As A Real Modular */
import type { TimelineRecord } from './timeline.types';

const DEMO_TIMELINE_RECORDS: TimelineRecord[] = [
  { id: 'timeline-1', label: 'Sample Timeline record', createdAt: new Date().toISOString() },
  { id: 'timeline-2', label: 'Timeline preview entry', createdAt: new Date().toISOString() },
];

export function listTimelineRecords(): TimelineRecord[] {
  return DEMO_TIMELINE_RECORDS;
}
