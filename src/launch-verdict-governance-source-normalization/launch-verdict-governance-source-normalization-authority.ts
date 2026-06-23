/**
 * Phase 27.06 — Launch Verdict Governance Source Normalization authority (V1).
 */

import { createHash } from 'node:crypto';
import { auditGovernanceSource } from './governance-source-auditor.js';
import { validateGovernancePayloadShape } from './governance-payload-shape-validator.js';
import { detectMissingGovernanceArrays } from './missing-array-detector.js';
import { detectDegradedGovernancePath } from './degraded-path-detector.js';
import { planLaunchVerdictGovernanceNormalization } from './normalization-planner.js';
import {
  applyLaunchVerdictGovernanceSourceInvariant,
  normalizeLaunchVerdictGovernanceAtPath,
} from './launch-verdict-governance-source-normalizer.js';
import { recordLaunchVerdictGovernanceSourceNormalization } from './launch-verdict-governance-source-normalization-history.js';
import {
  LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_CACHE_KEY_PREFIX,
  LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS,
  LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH,
} from './launch-verdict-governance-source-normalization-registry.js';
import type {
  ApplyLaunchVerdictGovernanceSourceNormalizationInput,
  LaunchVerdictGovernanceSourceNormalizationAssessment,
  LaunchVerdictGovernanceSourceNormalizationRecord,
  LaunchVerdictGovernanceSourceNormalizationResult,
  NormalizeLaunchVerdictGovernanceSourceInput,
} from './launch-verdict-governance-source-normalization-types.js';
import type { LaunchVerdictGovernanceAssessment } from '../launch-verdict-governance/launch-verdict-governance-types.js';
import type { FounderTestV5Report } from '../founder-testing-mode/founder-testing-v5-types.js';

let normalizationCounter = 0;

export function resetLaunchVerdictGovernanceSourceNormalizationCounterForTests(): void {
  normalizationCounter = 0;
}

export function resetLaunchVerdictGovernanceSourceNormalizationModuleForTests(): void {
  resetLaunchVerdictGovernanceSourceNormalizationCounterForTests();
}

function nextNormalizationId(): string {
  normalizationCounter += 1;
  return `launch-verdict-governance-source-normalization-${normalizationCounter}-${Date.now()}`;
}

function stableCacheKey(normalizationId: string, applied: boolean): string {
  const digest = createHash('sha256')
    .update(
      [LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS, normalizationId, String(applied)].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_CACHE_KEY_PREFIX}:${digest}`;
}

function buildRecord(input: {
  normalizationId: string;
  nowMs: number;
  normalizationApplied: boolean;
  sourcePath: string;
  sourceAudit: ReturnType<typeof auditGovernanceSource>;
  shapeValidation: ReturnType<typeof validateGovernancePayloadShape>;
  missingArrayDetection: ReturnType<typeof detectMissingGovernanceArrays>;
  degradedPathDetection: ReturnType<typeof detectDegradedGovernancePath>;
  repairPlan: ReturnType<typeof planLaunchVerdictGovernanceNormalization>;
}): LaunchVerdictGovernanceSourceNormalizationRecord {
  return {
    readOnly: true,
    normalizationId: input.normalizationId,
    generatedAt: new Date(input.nowMs).toISOString(),
    normalizationApplied: input.normalizationApplied,
    missingFieldsBeforeNormalization: input.missingArrayDetection.missingGovernanceArrays,
    sourcePath: input.sourcePath,
    upstreamProducer: input.degradedPathDetection.upstreamProducer,
    sourceAudit: input.sourceAudit,
    shapeValidation: input.shapeValidation,
    missingArrayDetection: input.missingArrayDetection,
    degradedPathDetection: input.degradedPathDetection,
    repairPlan: input.repairPlan,
  };
}

export function assessLaunchVerdictGovernanceSourceNormalization(
  input: NormalizeLaunchVerdictGovernanceSourceInput,
): LaunchVerdictGovernanceSourceNormalizationAssessment {
  const nowMs = input.nowMs ?? Date.now();
  const normalizationId = nextNormalizationId();
  const sourceAudit = auditGovernanceSource({
    governance: input.governance,
    sourcePath: input.sourcePath,
    upstreamProducer: input.upstreamProducer,
  });
  const shapeValidation = validateGovernancePayloadShape(input.governance);
  const missingArrayDetection = detectMissingGovernanceArrays(sourceAudit);
  const degradedPathDetection = detectDegradedGovernancePath({
    governance: input.governance,
    sourceAudit,
    degraded: input.degraded,
    upstreamProducer: input.upstreamProducer,
  });
  const repairPlan = planLaunchVerdictGovernanceNormalization({
    missingArrayDetection,
    degradedPathDetection,
  });

  const report = {
    readOnly: true as const,
    normalizationId,
    generatedAt: new Date(nowMs).toISOString(),
    normalizationApplied: false,
    missingFieldsBeforeNormalization: missingArrayDetection.missingGovernanceArrays,
    sourcePath: input.sourcePath,
    upstreamProducer: degradedPathDetection.upstreamProducer,
    sourceAudit,
    shapeValidation,
    missingArrayDetection,
    degradedPathDetection,
    repairPlan,
    passToken: shapeValidation.shapeValid ? LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS : null,
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
): LaunchVerdictGovernanceSourceNormalizationResult {
  const nowMs = input.nowMs ?? Date.now();
  const normalizationId = nextNormalizationId();
  const sourceAudit = auditGovernanceSource({
    governance: input.governance,
    sourcePath: input.sourcePath,
    upstreamProducer: input.upstreamProducer,
  });
  const shapeValidation = validateGovernancePayloadShape(input.governance);
  const missingArrayDetection = detectMissingGovernanceArrays(sourceAudit);
  const degradedPathDetection = detectDegradedGovernancePath({
    governance: input.governance,
    sourceAudit,
    degraded: input.degraded,
    upstreamProducer: input.upstreamProducer,
  });
  const repairPlan = planLaunchVerdictGovernanceNormalization({
    missingArrayDetection,
    degradedPathDetection,
  });

  const normalizationApplied = repairPlan.normalizationRequired;
  const governance = applyLaunchVerdictGovernanceSourceInvariant(input.governance, sourceAudit);

  const record = buildRecord({
    normalizationId,
    nowMs,
    normalizationApplied,
    sourcePath: input.sourcePath,
    sourceAudit,
    shapeValidation,
    missingArrayDetection,
    degradedPathDetection,
    repairPlan,
  });

  const report = {
    ...record,
    passToken: LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS,
  };
  recordLaunchVerdictGovernanceSourceNormalization(report);
  stableCacheKey(normalizationId, normalizationApplied);

  return { readOnly: true, governance, record, normalizationApplied };
}

export function applyLaunchVerdictGovernanceSourceNormalizationSync(
  input: ApplyLaunchVerdictGovernanceSourceNormalizationInput,
): {
  partial: Omit<FounderTestV5Report, 'reportMarkdown'>;
  record: LaunchVerdictGovernanceSourceNormalizationRecord;
  normalizationApplied: boolean;
} {
  const sourcePath = input.sourcePath ?? LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH;
  const { governance, record, normalizationApplied } = normalizeLaunchVerdictGovernanceSourceSync({
    governance: input.partial.v4?.launchVerdictGovernance,
    sourcePath,
    upstreamProducer: input.upstreamProducer ?? 'V5_REPORT_ASSEMBLY',
    degraded: input.degraded,
    nowMs: input.nowMs,
  });

  return {
    partial: {
      ...input.partial,
      v4: {
        ...input.partial.v4,
        launchVerdictGovernance: governance,
      },
    },
    record,
    normalizationApplied,
  };
}

export function normalizeRawResultLaunchVerdictGovernanceSource(rawResult: unknown): {
  patched: unknown;
  appliedPaths: string[];
  record: LaunchVerdictGovernanceSourceNormalizationRecord | null;
  payloadGuardRepairsRequired: number;
} {
  if (!rawResult || typeof rawResult !== 'object') {
    return { patched: rawResult, appliedPaths: [], record: null, payloadGuardRepairsRequired: 0 };
  }

  const rawRecord = rawResult as Record<string, unknown>;
  const report = rawRecord.report;
  if (!report || typeof report !== 'object') {
    return { patched: rawResult, appliedPaths: [], record: null, payloadGuardRepairsRequired: 0 };
  }

  const reportRecord = report as Record<string, unknown>;
  const v4 = reportRecord.v4 as Record<string, unknown> | undefined;
  const preAudit = auditGovernanceSource({
    governance: v4?.launchVerdictGovernance as Partial<LaunchVerdictGovernanceAssessment> | null | undefined,
    sourcePath: 'report.v4.launchVerdictGovernance',
    upstreamProducer: 'FOUNDER_SIMULATION_DEGRADED_PAYLOAD_GUARD',
  });

  const hadGovernanceIssues =
    preAudit.missingFields.length > 0 ||
    preAudit.undefinedFields.length > 0 ||
    preAudit.nonArrayFields.length > 0;

  if (!hadGovernanceIssues) {
    return { patched: rawResult, appliedPaths: [], record: null, payloadGuardRepairsRequired: 0 };
  }

  const root = JSON.parse(JSON.stringify(rawResult)) as Record<string, unknown>;
  const clonedReport = root.report as Record<string, unknown>;
  const normalized = normalizeLaunchVerdictGovernanceAtPath(
    clonedReport,
    'v4.launchVerdictGovernance',
    'FOUNDER_SIMULATION_DEGRADED_PAYLOAD_GUARD',
  );
  root.report = normalized.root;

  const { record } = normalizeLaunchVerdictGovernanceSourceSync({
    governance: ((normalized.root as Record<string, unknown>).v4 as Record<string, unknown> | undefined)
      ?.launchVerdictGovernance as LaunchVerdictGovernanceAssessment | null,
    sourcePath: 'report.v4.launchVerdictGovernance',
    upstreamProducer: 'FOUNDER_SIMULATION_DEGRADED_PAYLOAD_GUARD',
    degraded: true,
  });

  return {
    patched: root,
    appliedPaths: preAudit.missingFields.map(
      (field) => `report.v4.launchVerdictGovernance.${field}`,
    ),
    record,
    payloadGuardRepairsRequired: 0,
  };
}
