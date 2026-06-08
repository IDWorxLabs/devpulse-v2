/** DevPulse V2 Evidence Registry — types. */

export type EvidenceSource =
  | 'FOUNDATION_ENFORCEMENT'
  | 'TASK_GOVERNOR'
  | 'SHELL_AUTHORITY'
  | 'CHAT_AUTHORITY'
  | 'INLINE_OPERATOR_FEED'
  | 'BROWSER_VERIFICATION'
  | 'TRUST_ENGINE'
  | 'PROJECT_VAULT';

export type EvidenceStatus = 'PASS' | 'WARN' | 'FAIL' | 'INFO';

export interface EvidenceRecord {
  evidenceId: string;
  createdAt: number;
  source: EvidenceSource;
  label: string;
  summary: string;
  status: EvidenceStatus;
  relatedSystemId?: string;
  relatedRecordId?: string;
  tags: string[];
  warnings: string[];
  errors: string[];
}

export interface EvidenceSnapshot {
  snapshotId: string;
  capturedAt: number;
  evidenceCount: number;
  records: EvidenceRecord[];
}

export interface EvidenceRegistryState {
  ownerModule: string;
  evidenceCount: number;
  snapshotCount: number;
  sourceCounts: Partial<Record<EvidenceSource, number>>;
  warnCount: number;
  failCount: number;
  latestEvidenceId: string | null;
  warnings: string[];
  errors: string[];
}

export interface EvidenceRegistryReport {
  ownerModule: string;
  evidenceCount: number;
  sourceCounts: Partial<Record<EvidenceSource, number>>;
  latestEvidence: string | null;
  warnCount: number;
  failCount: number;
  snapshotCount: number;
  warnings: string[];
  errors: string[];
  recommendation: string;
  summary: string;
}

export type EvidenceRecordInput = Omit<EvidenceRecord, 'evidenceId' | 'createdAt'> & {
  evidenceId?: string;
  createdAt?: number;
};

export const REGISTRY_OWNER_MODULE = 'devpulse_v2_evidence_registry_authority';
export const REGISTRY_PASS_TOKEN = 'DEVPULSE_V2_EVIDENCE_REGISTRY_FOUNDATION_V1_PASS';
