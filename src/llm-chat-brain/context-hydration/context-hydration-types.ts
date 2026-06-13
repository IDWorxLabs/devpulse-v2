/**
 * Phase 26.2 — Context hydration types.
 */

export type ContextSource =
  | 'IDENTITY'
  | 'SELF_MODEL'
  | 'CAPABILITY_BOUNDARIES'
  | 'PROJECT_VAULT'
  | 'FOUNDER_TEST'
  | 'EXECUTION_PROOF'
  | 'VERIFICATION'
  | 'WORKSPACE'
  | 'PROJECT_HISTORY'
  | 'LAUNCH_COUNCIL';

export type ContextConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type ContextProofLevel = 'PROVEN' | 'PARTIAL' | 'UNKNOWN' | 'CONTRADICTED';

export interface ContextSection {
  readOnly: true;
  id: string;
  label: string;
  content: string;
  confidence: ContextConfidence;
  proofLevel: ContextProofLevel;
  source: ContextSource;
}

export interface HydratedContext {
  readOnly: true;
  message: string;
  sections: ContextSection[];
  sourcesUsed: ContextSource[];
  hydratedFactCount: number;
  overallConfidence: ContextConfidence;
  projectContext: string | null;
  executionContext: string | null;
  verificationContext: string | null;
  launchContext: string | null;
  historyContext: string | null;
}

export type ContextHydrationStatus = 'SUCCESS' | 'PARTIAL' | 'SKIPPED';

export interface ContextHydrationResult {
  readOnly: true;
  status: ContextHydrationStatus;
  hydrated: HydratedContext;
  selectedSources: ContextSource[];
  skippedSources: ContextSource[];
}
