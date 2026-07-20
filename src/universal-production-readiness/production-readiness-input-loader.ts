/**
 * Universal Production Readiness Verification V1 — authoritative input loading.
 *
 * Consumes B8, B9, B10 workspace artifacts. Raw prompt does not grant readiness.
 */

import { createHash } from 'node:crypto';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { UniversalBehaviorVerificationReport } from '../universal-behavioral-verification/universal-behavior-types.js';
import type { CapabilityCoverageReport, CapabilityCoverageSnapshot } from '../universal-capability-coverage/universal-capability-coverage-types.js';
import type { UniversalCapabilityCompositionPlan } from '../universal-capability-composition-engine/universal-capability-composition-types.js';
import type { CapabilityCompositionReport } from '../universal-capability-composition-engine/capability-composition-report.js';
import { envelopeFingerprint } from '../universal-capability-composition-engine/capability-composition-requirement-loader.js';
import type { ProductionReadinessInput } from './universal-production-readiness-types.js';

function readJsonFile<T>(files: readonly GeneratedWorkspaceFile[], suffix: string): T | null {
  const file = files.find((f) => f.relativePath.endsWith(suffix));
  if (!file) return null;
  try {
    return JSON.parse(file.content) as T;
  } catch {
    return null;
  }
}

export function fingerprintWorkspaceFiles(files: readonly GeneratedWorkspaceFile[]): string {
  const parts = files.map((f) => `${f.relativePath}:${createHash('sha256').update(f.content).digest('hex').slice(0, 12)}`).sort();
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
}

export function fingerprintBehaviorReport(report: UniversalBehaviorVerificationReport | null): string {
  if (!report) return '';
  return createHash('sha256')
    .update(`${report.reportId}|${report.verifiedCount}|${report.failedCount}|${report.notExecutedCount}|${report.results.length}`)
    .digest('hex')
    .slice(0, 32);
}

export function fingerprintCoverageSnapshot(snapshot: CapabilityCoverageSnapshot | null): string {
  if (!snapshot) return '';
  return createHash('sha256')
    .update(`${snapshot.snapshotId}|${snapshot.capabilities.length}|${snapshot.scorecard.capabilityMaturityIndex}`)
    .digest('hex')
    .slice(0, 32);
}

export function loadProductionReadinessInput(input: {
  envelope: ApprovedProductionBuildEnvelope;
  workspaceFiles: readonly GeneratedWorkspaceFile[];
  moduleIds: readonly string[];
  contractId: string;
}): ProductionReadinessInput {
  const compositionPlan = readJsonFile<UniversalCapabilityCompositionPlan>(
    input.workspaceFiles,
    'capability-composition-plan.json',
  );
  const compositionReport = readJsonFile<CapabilityCompositionReport>(
    input.workspaceFiles,
    'capability-composition-report.json',
  );
  const behaviorReport = readJsonFile<UniversalBehaviorVerificationReport>(
    input.workspaceFiles,
    'behavior-verification-report.json',
  );
  const coverageSnapshot = readJsonFile<CapabilityCoverageSnapshot>(
    input.workspaceFiles,
    'capability-coverage-snapshot.json',
  );
  const coverageReport = readJsonFile<CapabilityCoverageReport>(
    input.workspaceFiles,
    'capability-coverage-report.json',
  );

  return {
    envelope: input.envelope,
    workspaceFiles: input.workspaceFiles,
    compositionPlan,
    compositionReport,
    behaviorReport,
    coverageSnapshot,
    coverageReport,
    moduleIds: input.moduleIds,
    contractId: input.contractId,
  };
}

export function buildReadinessFingerprints(input: ProductionReadinessInput): {
  envelopeFingerprint: string;
  compositionPlanFingerprint: string;
  generatedWorkspaceFingerprint: string;
  behaviorReportFingerprint: string;
  capabilityCoverageFingerprint: string;
} {
  return {
    envelopeFingerprint: envelopeFingerprint(input.envelope),
    compositionPlanFingerprint: input.compositionPlan?.planFingerprint ?? '',
    generatedWorkspaceFingerprint: fingerprintWorkspaceFiles(input.workspaceFiles),
    behaviorReportFingerprint: fingerprintBehaviorReport(input.behaviorReport),
    capabilityCoverageFingerprint: fingerprintCoverageSnapshot(input.coverageSnapshot),
  };
}
