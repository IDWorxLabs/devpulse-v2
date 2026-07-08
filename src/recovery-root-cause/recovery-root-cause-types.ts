/**
 * Recovery Root Cause Engine — types and pass token.
 */

export const ROOT_CAUSE_ENGINE_OWNER_MODULE = 'devpulse_v2_recovery_root_cause_engine';
export const ROOT_CAUSE_ENGINE_V1_PASS_TOKEN = 'ROOT_CAUSE_ENGINE_V1_PASS';

export type RootCauseCategory =
  | 'ARCHITECTURE'
  | 'BUILD'
  | 'DEPENDENCY'
  | 'WORKSPACE'
  | 'MATERIALIZATION'
  | 'VALIDATION'
  | 'RUNTIME'
  | 'PREVIEW'
  | 'RESOURCE'
  | 'PLATFORM'
  | 'EXTERNAL_API'
  | 'UNKNOWN';

export interface RootCauseAnalysis {
  readOnly: true;
  analysisId: string;
  category: RootCauseCategory;
  failureStage: string;
  failureReason: string;
  confidence: number;
  evidenceRefs: readonly string[];
  summary: string;
  classifiedAt: number;
}

export interface RootCauseAnalysisInput {
  failureStage: string;
  failureReason: string;
  evidenceRefs?: readonly string[];
  blockers?: readonly string[];
}
