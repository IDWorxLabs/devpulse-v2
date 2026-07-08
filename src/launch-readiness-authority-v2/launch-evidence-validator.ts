/**
 * Launch Readiness Authority V2 — evidence validation.
 */

import type {
  LaunchEvidenceCollectionResult,
  LaunchEvidenceSourceRecord,
  LaunchEvidenceValidationResult,
} from './launch-readiness-types.js';
import { EVIDENCE_MAX_AGE_MS, EVIDENCE_SCHEMA_VERSION, REQUIRED_LAUNCH_EVIDENCE_SOURCES } from './launch-readiness-types.js';

function sourceById(
  evidence: LaunchEvidenceCollectionResult,
  sourceId: LaunchEvidenceSourceRecord['sourceId'],
): LaunchEvidenceSourceRecord | undefined {
  return evidence.sources.find((s) => s.sourceId === sourceId);
}

export function validateLaunchEvidence(
  evidence: LaunchEvidenceCollectionResult,
  now = Date.now(),
): LaunchEvidenceValidationResult {
  const issues: LaunchEvidenceValidationResult['issues'][number][] = [];
  const presentIds = new Set(evidence.sources.map((s) => s.sourceId));

  for (const required of REQUIRED_LAUNCH_EVIDENCE_SOURCES) {
    if (!presentIds.has(required)) {
      issues.push({
        readOnly: true,
        code: 'MISSING_EVIDENCE',
        severity: 'BLOCKING',
        sourceId: required,
        detail: `${required} evidence source omitted`,
      });
    }
  }

  if (evidence.missingSources.length) {
    for (const missing of evidence.missingSources) {
      issues.push({
        readOnly: true,
        code: 'EVIDENCE_INCOMPLETE',
        severity: 'BLOCKING',
        sourceId: missing,
        detail: `${missing} evidence not collected`,
      });
    }
  }

  const evidenceIds = new Map<string, LaunchEvidenceSourceRecord['sourceId']>();
  for (const source of evidence.sources) {
    if (source.status === 'UNAVAILABLE' || source.status === 'INCOMPLETE') {
      issues.push({
        readOnly: true,
        code: 'EVIDENCE_INCOMPLETE',
        severity: 'BLOCKING',
        sourceId: source.sourceId,
        detail: `${source.sourceName} evidence unavailable`,
      });
    } else if (source.status === 'DEGRADED_WITH_WORKSPACE_EVIDENCE') {
      issues.push({
        readOnly: true,
        code: 'EVIDENCE_DEGRADED',
        severity: 'WARNING',
        sourceId: source.sourceId,
        detail: `${source.sourceName} derived from workspace source — live runtime evidence deferred`,
      });
    }

    if (!source.evidenceId || source.evidenceId.length < 8) {
      issues.push({
        readOnly: true,
        code: 'EVIDENCE_INVALID_SIGNATURE',
        severity: 'BLOCKING',
        sourceId: source.sourceId,
        detail: `Invalid evidence signature for ${source.sourceId}`,
      });
    }

    if (source.schemaVersion !== EVIDENCE_SCHEMA_VERSION) {
      issues.push({
        readOnly: true,
        code: 'EVIDENCE_VERSION_INCOMPATIBLE',
        severity: 'BLOCKING',
        sourceId: source.sourceId,
        detail: `Schema mismatch: ${source.schemaVersion}`,
      });
    }

    if (now - source.validationTimestamp > EVIDENCE_MAX_AGE_MS) {
      issues.push({
        readOnly: true,
        code: 'EVIDENCE_STALE',
        severity: 'WARNING',
        sourceId: source.sourceId,
        detail: `${source.sourceName} evidence stale`,
      });
    }

    const prior = evidenceIds.get(source.evidenceId);
    if (prior && prior !== source.sourceId) {
      issues.push({
        readOnly: true,
        code: 'EVIDENCE_DUPLICATE',
        severity: 'BLOCKING',
        sourceId: source.sourceId,
        detail: `Duplicate evidence ID ${source.evidenceId}`,
      });
    } else {
      evidenceIds.set(source.evidenceId, source.sourceId);
    }
  }

  const intent = sourceById(evidence, 'INTENT_UNDERSTANDING');
  const faith = sourceById(evidence, 'PROMPT_FAITHFULNESS');
  if (intent?.status === 'PASS' && faith?.status === 'FAIL') {
    issues.push({
      readOnly: true,
      code: 'EVIDENCE_CONFLICT',
      severity: 'BLOCKING',
      sourceId: 'PROMPT_FAITHFULNESS',
      detail: 'Intent passed while prompt faithfulness failed',
    });
  }

  const execution = sourceById(evidence, 'EXECUTION_TRACE');
  if (execution?.status === 'UNAVAILABLE') {
    issues.push({
      readOnly: true,
      code: 'EVIDENCE_INCOMPLETE',
      severity: 'BLOCKING',
      sourceId: 'EXECUTION_TRACE',
      detail: 'Execution Trace evidence unavailable',
    });
  }

  const blocking = issues.filter((i) => i.severity === 'BLOCKING');
  const requiredCount = REQUIRED_LAUNCH_EVIDENCE_SOURCES.length;
  const collectedCount = evidence.sources.filter(
    (s) =>
      s.status !== 'UNAVAILABLE' &&
      s.status !== 'INCOMPLETE',
  ).length;
  const completenessScore = Math.round((collectedCount / requiredCount) * 100);
  const freshnessScore = Math.round(
    evidence.sources.reduce((sum, s) => sum + (now - s.validationTimestamp <= EVIDENCE_MAX_AGE_MS ? 1 : 0), 0) /
      Math.max(evidence.sources.length, 1) *
      100,
  );
  const consistencyScore = issues.some((i) => i.code === 'EVIDENCE_CONFLICT') ? 0 : 100;

  const primaryBlockReason =
    blocking.find((i) => i.code === 'EVIDENCE_INCOMPLETE' || i.code === 'MISSING_EVIDENCE')?.detail ??
    blocking[0]?.detail ??
    null;

  return {
    readOnly: true,
    valid: blocking.length === 0,
    primaryBlockReason,
    issues,
    freshnessScore,
    completenessScore,
    consistencyScore,
  };
}
