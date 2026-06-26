/** Service adapter for projects — Lisa As A Real Modular */
import type { ProjectsRecord } from './projects.types';

const DEMO_PROJECTS_RECORDS: ProjectsRecord[] = [
  { id: 'projects-1', label: 'Sample Projects record', createdAt: new Date().toISOString() },
  { id: 'projects-2', label: 'Projects preview entry', createdAt: new Date().toISOString() },
];

export function listProjectsRecords(): ProjectsRecord[] {
  return DEMO_PROJECTS_RECORDS;
}
