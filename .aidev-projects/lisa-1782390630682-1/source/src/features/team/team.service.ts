/** Service adapter for team — Lisa As A Real Modular */
import type { TeamRecord } from './team.types';

const DEMO_TEAM_RECORDS: TeamRecord[] = [
  { id: 'team-1', label: 'Sample Team record', createdAt: new Date().toISOString() },
  { id: 'team-2', label: 'Team preview entry', createdAt: new Date().toISOString() },
];

export function listTeamRecords(): TeamRecord[] {
  return DEMO_TEAM_RECORDS;
}
