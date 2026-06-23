/**
 * Phase 27.04 — V5 Launch Verdict Governance Source Normalization authority (V1).
 */

import { createHash } from 'node:crypto';
import { auditLaunchVerdictGovernanceSource } from './launch-verdict-governance-source-auditor.js';
import { detectLaunchVerdictGovernanceShape } from './launch-verdict-governance-shape-detector.js';
import {
  normalizeLaunchVerdictGovernanceArrays,
  normalizeLaunchVerdictGovernanceAtPath,
} from './launch-verdict-governance-source-normalizer.js';
import { planLaunchVerdictGovernanceNormalizationRepair } from './launch-verdict-governance-repair-planner.js';
import { recordLaunchVerdictGovernanceSourceNormalization } from './launch-verdict-governance-normalization-history.js';
import {
  LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH,
  V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_CACHE_KEY_PREFIX,
  V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS,
} from './v5-launch-verdict-governance-source-normalization-registry.js';
import type {
  ApplyV5LaunchVerdictGovernanceSourceNormalizationInput,
  LaunchVerdictGovernanceSourceNormalizationRecord,
  NormalizeLaunchVerdictGovernanceSourceInput,
  V5LaunchVerdictGovernanceSourceNormalizationAssessment,
  V5LaunchVerdictGovernanceSourceNormalizationResult,
} from './v5-launch-verdict-governance-source-normalization-types.js';
import type { LaunchVerdictGovernanceAssessment } from '../launch-verdict-governance/launch-verdict-governance-types.js';

let normalizationCounter = 0;

export function resetV5LaunchVerdictGovernanceSourceNormalizationCounterForTests(): void {
  normalizationCounter = 0;
}

export function resetV5LaunchVerdictGovernanceSourceNormalizationModuleForTests(): void {
  resetV5LaunchVerdictGovernanceSourceNormalizationCounterForTests();
}

function nextNormalizationId(): string {
  normalizationCounter += 1;
  return `v5-launch-verdict-governance-source-normalization-${normalizationCounter}-${Date.now()}`;
}

function stableCacheKey(normalizationId: string, applied: boolean): string {
  const digest = createHash('sha256')
    .update(
      [V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS, normalizationId, String(applied)].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessV5LaunchVerdictGovernanceSourceNormalization(
  input: NormalizeLaunchVerdictGovernanceSourceInput,
): V5LaunchVerdictGovernanceSourceNormalizationAssessment {
  const nowMs = input.nowMs ?? Date.now();
  const normalizationId = nextNormalizationId();
  const sourceAudit = auditLaunchVerdictGovernanceSource({
    governance: input.governance,
    sourcePath: input.sourcePath,
    producerAuthority: input.producerAuthority,
  });
  const shapeDetection = detectLaunchVerdictGovernanceShape(sourceAudit);
  const repairPlan = planLaunchVerdictGovernanceNormalizationRepair(shapeDetection);
  const chainSatisfied = !shapeDetection.normalizationRequired;

  const report = {
    readOnly: true as const,
    normalizationId,
    generatedAt: new Date(nowMs).toISOString(),
    normalizationApplied: false,
    missingFieldsBeforeNormalization: shapeDetection.missingFieldsBeforeNormalization,
    sourcePath: input.sourcePath,
    producerAuthority: sourceAudit.producerAuthority,
    sourceAudit,
    shapeDetection,
    repairPlan,
    passToken: chainSatisfied ? V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS : null,
  };

  recordLaunchVerdictGovernanceSourceNormalization(report);
  stableCacheKey(normalizationId, false);

  return {
    readOnly: true,
    advisoryOnly: true,
    report,
  };
}

export function normalizeLaunchVerdictGovernanceSourceSync(
  input: NormalizeLaunchVerdictGovernanceSourceInput,
): {
  governance: LaunchVerdictGovernanceAssessment;
  record: LaunchVerdictGovernanceSourceNormalizationRecord;
} {
  const nowMs = input.nowMs ?? Date.now();
  const normalizationId = nextNormalizationId();
  const sourceAudit = auditLaunchVerdictGovernanceSource({
    governance: input.governance,
    sourcePath: input.sourcePath,
    producerAuthority: input.producerAuthority,
  });
  const shapeDetection = detectLaunchVerdictGovernanceShape(sourceAudit);
  const repairPlan = planLaunchVerdictGovernanceNormalizationRepair(shapeDetection);
  const normalizationApplied = repairPlan.repairRequired;
  const governance = normalizeLaunchVerdictGovernanceArrays(input.governance, sourceAudit);

  const record: LaunchVerdictGovernanceSourceNormalizationRecord = {
    readOnly: true,
    normalizationId,
    generatedAt: new Date(nowMs).toISOString(),
    normalizationApplied,
    missingFieldsBeforeNormalization: shapeDetection.missingFieldsBeforeNormalization,
    sourcePath: input.sourcePath,
    producerAuthority: sourceAudit.producerAuthority,
    sourceAudit,
    shapeDetection,
    repairPlan,
  };

  const report = {
    normalizationId,
    generatedAt: new Date(nowMs).toISOString(),
    normalizationApplied,
    missingFieldsBeforeNormalization: shapeDetection.missingFieldsBeforeNormalization,
    sourcePath: input.sourcePath,
    producerAuthority: sourceAudit.producerAuthority,
    sourceAudit,
    shapeDetection,
    repairPlan,
    passToken: V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS,
    readOnly: true as const,
  };
  recordLaunchVerdictGovernanceSourceNormalization(report);
  stableCacheKey(normalizationId, normalizationApplied);

  return { governance, record };
}

export function applyV5LaunchVerdictGovernanceSourceNormalizationSync(
  input: ApplyV5LaunchVerdictGovernanceSourceNormalizationInput,
): V5LaunchVerdictGovernanceSourceNormalizationResult {
  const sourcePath = input.sourcePath ?? LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH;
  const { governance, record } = normalizeLaunchVerdictGovernanceSourceSync({
    governance: input.partial.v4?.launchVerdictGovernance,
    sourcePath,
    producerAuthority: input.producerAuthority ?? 'V5_REPORT_ASSEMBLY',
    nowMs: input.nowMs,
  });

  return {
    readOnly: true,
    partial: {
      ...input.partial,
      v4: {
        ...input.partial.v4,
        launchVerdictGovernance: governance,
      },
    },
    record,
    normalizationApplied: record.normalizationApplied,
  };
}

export function normalizeRawResultLaunchVerdictGovernanceSource(rawResult: unknown): {
  patched: unknown;
  appliedPaths: string[];
  record: LaunchVerdictGovernanceSourceNormalizationRecord | null;
} {
  if (!rawResult || typeof rawResult !== 'object') {
    return { patched: rawResult, appliedPaths: [], record: null };
  }

  const root = JSON.parse(JSON.stringify(rawResult)) as Record<string, unknown>;
  const report = root.report;
  if (!report || typeof report !== 'object') {
    return { patched: rawResult, appliedPaths: [], record: null };
  }

  const reportRecord = report as Record<string, unknown>;
  const v4 = reportRecord.v4 as Record<string, unknown> | undefined;
  const preAudit = auditLaunchVerdictGovernanceSource({
    governance: v4?.launchVerdictGovernance as Partial<LaunchVerdictGovernanceAssessment> | null | undefined,
    sourcePath: 'report.v4.launchVerdictGovernance',
    producerAuthority: 'FOUNDER_SIMULATION_RESULT_MERGE',
  });

  const normalized = normalizeLaunchVerdictGovernanceAtPath(reportRecord, 'v4.launchVerdictGovernance');

  if (!preAudit.missingFields.length && !preAudit.undefinedFields.length && !preAudit.nonArrayFields.length) {
    return { patched: rawResult, appliedPaths: [], record: null };
  }

  root.report = normalized.root;
  const { record } = normalizeLaunchVerdictGovernanceSourceSync({
    governance: ((normalized.root as Record<string, unknown>).v4 as Record<string, unknown> | undefined)
      ?.launchVerdictGovernance as LaunchVerdictGovernanceAssessment | null,
    sourcePath: 'report.v4.launchVerdictGovernance',
    producerAuthority: 'FOUNDER_SIMULATION_RESULT_MERGE',
  });

  return {
    patched: root,
    appliedPaths: preAudit.missingFields.map(
      (field) => `report.v4.launchVerdictGovernance.${field}`,
    ),
    record,
  };
}
