/** Service adapter for follow-ups — CRM */
import type { FollowUpsRecord } from './follow-ups.types';

const DEMO_FOLLOW_UPS_RECORDS: FollowUpsRecord[] = [
  { id: 'follow-ups-1', label: 'Sample Follow Ups record', createdAt: new Date().toISOString() },
  { id: 'follow-ups-2', label: 'Follow Ups preview entry', createdAt: new Date().toISOString() },
];

export function listFollowUpsRecords(): FollowUpsRecord[] {
  return DEMO_FOLLOW_UPS_RECORDS;
}
