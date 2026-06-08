/** DevPulse V2 Context Arbitration — types. */

export type ContextSource =
  | 'INTENT_ARCHITECTURE'
  | 'CENTRAL_BRAIN'
  | 'PROJECT_VAULT'
  | 'TIMELINE_LEDGER'
  | 'EVIDENCE_REGISTRY'
  | 'TRUST_ENGINE';

export type ContextPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'IGNORE';

export interface ContextCandidate {
  contextId: string;
  source: ContextSource;
  label: string;
  summary: string;
  priority: ContextPriority;
  createdAt: number;
}

export interface ContextArbitrationResult {
  arbitrationId: string;
  createdAt: number;
  selectedContext: ContextCandidate[];
  ignoredContext: ContextCandidate[];
  warnings: string[];
  errors: string[];
}

export interface ContextArbitrationState {
  arbitrationId: string;
  arbitrationCount: number;
  warnings: string[];
  errors: string[];
}

export interface ArbitrationSummary {
  arbitrationId: string;
  selectedCount: number;
  ignoredCount: number;
  summary: string;
  publishedAt: number;
}

export interface ContextArbitrationReport {
  ownerModule: string;
  totalArbitrations: number;
  selectedContextCount: number;
  ignoredContextCount: number;
  latestArbitration: ContextArbitrationResult | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const CONTEXT_ARBITRATION_OWNER_MODULE = 'devpulse_v2_context_arbitration_authority';
export const CONTEXT_ARBITRATION_PASS_TOKEN =
  'DEVPULSE_V2_CONTEXT_ARBITRATION_FOUNDATION_V1_PASS';

export const ALL_CONTEXT_SOURCES: readonly ContextSource[] = [
  'INTENT_ARCHITECTURE',
  'CENTRAL_BRAIN',
  'PROJECT_VAULT',
  'TIMELINE_LEDGER',
  'EVIDENCE_REGISTRY',
  'TRUST_ENGINE',
];
