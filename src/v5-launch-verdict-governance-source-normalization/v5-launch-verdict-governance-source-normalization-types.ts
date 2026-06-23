/**
 * Phase 27.04 — V5 Launch Verdict Governance Source Normalization types (V1).
 */

import type { LaunchVerdictGovernanceAssessment } from '../launch-verdict-governance/launch-verdict-governance-types.js';
import type { FounderTestV5Report } from '../founder-testing-mode/founder-testing-v5-types.js';

export type LaunchVerdictGovernanceProducerAuthority =
  | 'LAUNCH_VERDICT_GOVERNANCE_AUTHORITY'
  | 'V4_REPORT_ASSEMBLY'
  | 'V5_REPORT_ASSEMBLY'
  | 'FOUNDER_SIMULATION_RESULT_MERGE'
  | 'DEGRADED_FALLBACK_PAYLOAD'
  | 'DIAGNOSTIC_REPORT_PATH'
  | 'UNKNOWN';

export type LaunchVerdictGovernanceShapeFailureClass =
  | 'REQUIRED_EVIDENCE_MISSING_ABSENT'
  | 'BLOCKING_AUTHORITIES_ABSENT'
  | 'SATISFIED_RULES_ABSENT'
  | 'FAILED_RULES_ABSENT'
  | 'GOVERNANCE_REASONING_ABSENT'
  | 'GOVERNANCE_OBJECT_ABSENT'
  | 'MULTIPLE_GOVERNANCE_ARRAYS_ABSENT'
  | 'NONE';

export interface LaunchVerdictGovernanceSourceAudit {
  readOnly: true;
  governancePresent: boolean;
  missingFields: readonly string[];
  undefinedFields: readonly string[];
  nonArrayFields: readonly string[];
  producerAuthority: LaunchVerdictGovernanceProducerAuthority;
  sourcePath: string;
  failureClass: LaunchVerdictGovernanceShapeFailureClass;
  reason: string | null;
}

export interface LaunchVerdictGovernanceShapeDetection {
  readOnly: true;
  normalizationRequired: boolean;
  missingFieldsBeforeNormalization: readonly string[];
  failureClass: LaunchVerdictGovernanceShapeFailureClass;
  reason: string | null;
}

export interface LaunchVerdictGovernanceNormalizationRepairPlan {
  readOnly: true;
  repairRequired: boolean;
  actions: readonly string[];
  fieldsToNormalize: readonly string[];
  reason: string | null;
}

export interface LaunchVerdictGovernanceSourceNormalizationRecord {
  readOnly: true;
  normalizationId: string;
  generatedAt: string;
  normalizationApplied: boolean;
  missingFieldsBeforeNormalization: readonly string[];
  sourcePath: string;
  producerAuthority: LaunchVerdictGovernanceProducerAuthority;
  sourceAudit: LaunchVerdictGovernanceSourceAudit;
  shapeDetection: LaunchVerdictGovernanceShapeDetection;
  repairPlan: LaunchVerdictGovernanceNormalizationRepairPlan;
}

export interface V5LaunchVerdictGovernanceSourceNormalizationReport {
  readOnly: true;
  normalizationId: string;
  generatedAt: string;
  normalizationApplied: boolean;
  missingFieldsBeforeNormalization: readonly string[];
  sourcePath: string;
  producerAuthority: LaunchVerdictGovernanceProducerAuthority;
  sourceAudit: LaunchVerdictGovernanceSourceAudit;
  shapeDetection: LaunchVerdictGovernanceShapeDetection;
  repairPlan: LaunchVerdictGovernanceNormalizationRepairPlan;
  passToken: string | null;
}

export interface V5LaunchVerdictGovernanceSourceNormalizationAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: V5LaunchVerdictGovernanceSourceNormalizationReport;
}

export interface NormalizeLaunchVerdictGovernanceSourceInput {
  governance: Partial<LaunchVerdictGovernanceAssessment> | null | undefined;
  sourcePath: string;
  producerAuthority?: LaunchVerdictGovernanceProducerAuthority;
  nowMs?: number;
}

export interface ApplyV5LaunchVerdictGovernanceSourceNormalizationInput {
  partial: Omit<FounderTestV5Report, 'reportMarkdown'>;
  sourcePath: string;
  producerAuthority?: LaunchVerdictGovernanceProducerAuthority;
  nowMs?: number;
}

export interface V5LaunchVerdictGovernanceSourceNormalizationResult {
  readOnly: true;
  partial: Omit<FounderTestV5Report, 'reportMarkdown'>;
  record: LaunchVerdictGovernanceSourceNormalizationRecord;
  normalizationApplied: boolean;
}
