/**
 * Phase 27.06 — Launch Verdict Governance Source Normalization types (V1).
 */

import type { LaunchVerdictGovernanceAssessment } from '../launch-verdict-governance/launch-verdict-governance-types.js';
import type { FounderTestV5Report } from '../founder-testing-mode/founder-testing-v5-types.js';

export type LaunchVerdictGovernanceUpstreamProducer =
  | 'LAUNCH_VERDICT_GOVERNANCE_AUTHORITY'
  | 'V4_REPORT_ASSEMBLY'
  | 'LAUNCH_COUNCIL_FINALIZATION'
  | 'V5_REPORT_ASSEMBLY'
  | 'FOUNDER_SIMULATION_DEGRADED_PAYLOAD_GUARD'
  | 'FOUNDER_SIMULATION_RESULT_MERGE'
  | 'DIAGNOSTIC_REPORT_PATH'
  | 'UNKNOWN';

export type LaunchVerdictGovernanceSourceFailureClass =
  | 'REQUIRED_EVIDENCE_MISSING_ABSENT'
  | 'BLOCKING_AUTHORITIES_ABSENT'
  | 'GOVERNANCE_ARRAYS_OMITTED'
  | 'DEGRADED_PARTIAL_GOVERNANCE_PAYLOAD'
  | 'JSON_ROUND_TRIP_STRIPPED_ARRAYS'
  | 'WARNING_PATH_SKIPPED_INITIALIZATION'
  | 'MULTIPLE_GOVERNANCE_ARRAYS_ABSENT'
  | 'GOVERNANCE_OBJECT_ABSENT'
  | 'NONE';

export interface GovernanceSourceAudit {
  readOnly: true;
  governancePresent: boolean;
  missingFields: readonly string[];
  undefinedFields: readonly string[];
  nonArrayFields: readonly string[];
  sourcePath: string;
  producerAuthority: LaunchVerdictGovernanceUpstreamProducer;
  failureClass: LaunchVerdictGovernanceSourceFailureClass;
  reason: string | null;
}

export interface GovernancePayloadShapeValidation {
  readOnly: true;
  shapeValid: boolean;
  missingArrayFields: readonly string[];
  invalidArrayFields: readonly string[];
  reason: string | null;
}

export interface MissingArrayDetection {
  readOnly: true;
  missingRequiredEvidenceMissing: boolean;
  missingBlockingAuthorities: boolean;
  missingGovernanceArrays: readonly string[];
  normalizationRequired: boolean;
  reason: string | null;
}

export interface DegradedPathDetection {
  readOnly: true;
  degradedPath: boolean;
  warningPath: boolean;
  partialGovernancePayload: boolean;
  skippedAuthorityInitialization: boolean;
  upstreamProducer: LaunchVerdictGovernanceUpstreamProducer;
  reason: string | null;
}

export interface LaunchVerdictGovernanceNormalizationPlan {
  readOnly: true;
  normalizationRequired: boolean;
  actions: readonly string[];
  fieldsToNormalize: readonly string[];
  upstreamProducer: LaunchVerdictGovernanceUpstreamProducer;
  reason: string | null;
}

export interface LaunchVerdictGovernanceSourceNormalizationRecord {
  readOnly: true;
  normalizationId: string;
  generatedAt: string;
  normalizationApplied: boolean;
  missingFieldsBeforeNormalization: readonly string[];
  sourcePath: string;
  upstreamProducer: LaunchVerdictGovernanceUpstreamProducer;
  sourceAudit: GovernanceSourceAudit;
  shapeValidation: GovernancePayloadShapeValidation;
  missingArrayDetection: MissingArrayDetection;
  degradedPathDetection: DegradedPathDetection;
  repairPlan: LaunchVerdictGovernanceNormalizationPlan;
}

export interface LaunchVerdictGovernanceSourceNormalizationReport {
  readOnly: true;
  normalizationId: string;
  generatedAt: string;
  normalizationApplied: boolean;
  missingFieldsBeforeNormalization: readonly string[];
  sourcePath: string;
  upstreamProducer: LaunchVerdictGovernanceUpstreamProducer;
  sourceAudit: GovernanceSourceAudit;
  shapeValidation: GovernancePayloadShapeValidation;
  missingArrayDetection: MissingArrayDetection;
  degradedPathDetection: DegradedPathDetection;
  repairPlan: LaunchVerdictGovernanceNormalizationPlan;
  passToken: string | null;
}

export interface LaunchVerdictGovernanceSourceNormalizationAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: LaunchVerdictGovernanceSourceNormalizationReport;
}

export interface NormalizeLaunchVerdictGovernanceSourceInput {
  governance: Partial<LaunchVerdictGovernanceAssessment> | null | undefined;
  sourcePath: string;
  upstreamProducer?: LaunchVerdictGovernanceUpstreamProducer;
  degraded?: boolean;
  nowMs?: number;
}

export interface ApplyLaunchVerdictGovernanceSourceNormalizationInput {
  partial: Omit<FounderTestV5Report, 'reportMarkdown'>;
  sourcePath: string;
  upstreamProducer?: LaunchVerdictGovernanceUpstreamProducer;
  degraded?: boolean;
  nowMs?: number;
}

export interface LaunchVerdictGovernanceSourceNormalizationResult {
  readOnly: true;
  governance: LaunchVerdictGovernanceAssessment;
  record: LaunchVerdictGovernanceSourceNormalizationRecord;
  normalizationApplied: boolean;
}
