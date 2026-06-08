/** DevPulse V2 Central Brain — types. */

export type BrainSystemStatus = 'READY' | 'WARN' | 'FAIL' | 'UNKNOWN';

export type BrainOverallStatus = 'READY' | 'WARN' | 'FAIL';

export interface BrainSystemSummary {
  systemId: string;
  owner: string;
  status: BrainSystemStatus;
  summary: string;
  lastUpdatedAt: number;
}

export interface BrainState {
  brainId: string;
  createdAt: number;
  systems: BrainSystemSummary[];
  warnings: string[];
  errors: string[];
}

export interface BrainCoordinationSummary {
  totalSystems: number;
  readySystems: number;
  warningSystems: number;
  failedSystems: number;
  overallStatus: BrainOverallStatus;
}

export interface CentralBrainReport {
  ownerModule: string;
  systemCount: number;
  readyCount: number;
  warningCount: number;
  failCount: number;
  overallStatus: BrainOverallStatus;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const CENTRAL_BRAIN_OWNER_MODULE = 'devpulse_v2_central_brain_authority';
export const CENTRAL_BRAIN_PASS_TOKEN = 'DEVPULSE_V2_CENTRAL_BRAIN_FOUNDATION_V1_PASS';

export const OBSERVED_SYSTEM_IDS = [
  'trust_engine',
  'project_vault',
  'evidence_registry',
  'timeline_event_ledger',
] as const;

export type ObservedSystemId = (typeof OBSERVED_SYSTEM_IDS)[number];
