/** Service adapter for pipeline — CRM */
import type { PipelineRecord } from './pipeline.types';

const DEMO_PIPELINE_RECORDS: PipelineRecord[] = [
  { id: 'pipeline-1', label: 'Sample Pipeline record', createdAt: new Date().toISOString() },
  { id: 'pipeline-2', label: 'Pipeline preview entry', createdAt: new Date().toISOString() },
];

export function listPipelineRecords(): PipelineRecord[] {
  return DEMO_PIPELINE_RECORDS;
}
