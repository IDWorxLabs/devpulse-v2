/**
 * Autonomous Engineering Intelligence V1 — finding normalization from B11/B10/B8.
 */

import { createHash } from 'node:crypto';
import type { AutonomousEngineeringFinding, AutonomousEngineeringInput } from './autonomous-engineering-types.js';
import { AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE } from './autonomous-engineering-types.js';

const NEW_CAPABILITY_CODES = new Set([
  'blocked_by_authentication_pack',
  'blocked_by_authorization_pack',
  'blocked_by_scheduling_pack',
  'blocked_by_notification_pack',
  'blocked_by_file_management_pack',
  'blocked_by_reporting_pack',
  'blocked_by_external_integration_pack',
  'blocked_by_realtime_pack',
  'blocked_by_offline_pack',
  'required_capability_blocked',
]);

export function normalizeEngineeringFindings(input: AutonomousEngineeringInput): AutonomousEngineeringFinding[] {
  const findings: AutonomousEngineeringFinding[] = [];
  const report = input.readinessReport;
  if (!report) return findings;

  let idx = 0;
  const add = (partial: Omit<AutonomousEngineeringFinding, 'findingId' | 'fingerprint' | 'provenance'>) => {
    idx += 1;
    const findingId = `ae-finding-${partial.diagnosticCode}-${idx}`;
    const fingerprint = createHash('sha256').update(`${findingId}|${partial.diagnosticCode}|${partial.sourceFingerprint}`).digest('hex').slice(0, 16);
    findings.push({
      ...partial,
      findingId,
      fingerprint,
      provenance: [AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE, partial.sourceAuthority],
    });
  };

  for (const blocker of report.blockingFindings) {
    add({
      diagnosticCode: blocker.code,
      sourceAuthority: 'B11_PRODUCTION_READINESS',
      sourceEvaluationId: report.readinessEvaluationId,
      sourceFingerprint: report.fingerprint,
      severity: blocker.severity,
      criticality: blocker.severity === 'BLOCKER' ? 'CRITICAL' : 'REQUIRED',
      readinessDimension: blocker.dimension,
      requirementIds: blocker.requirementIds,
      behaviorIds: blocker.behaviorIds,
      capabilityKeys: blocker.capabilityKeys,
      providerIds: blocker.providerIds,
      packIds: blocker.packIds,
      contributionIds: [],
      artifactPaths: blocker.affectedArtifacts,
      routeIds: [],
      runtimeScopeIds: [],
      actionIds: [],
      workflowIds: [],
      relationshipIds: [],
      ruleIds: [],
      expectedState: blocker.expectedEvidence.join(';'),
      observedState: blocker.observedEvidence.join(';'),
      missingEvidence: [],
      contradictionEvidence: [],
      traceability: [report.readinessEvaluationId, blocker.findingId],
    });
  }

  for (const diag of report.aeoDiagnoses ?? []) {
    if (findings.some((f) => f.diagnosticCode === diag.code)) continue;
    add({
      diagnosticCode: diag.code,
      sourceAuthority: 'B11_AEO_DIAGNOSTICS',
      sourceEvaluationId: report.readinessEvaluationId,
      sourceFingerprint: report.fingerprint,
      severity: 'BLOCKER',
      criticality: NEW_CAPABILITY_CODES.has(diag.code) ? 'CRITICAL' : 'REQUIRED',
      readinessDimension: 'DIAGNOSTIC_READINESS',
      requirementIds: [],
      behaviorIds: [],
      capabilityKeys: [],
      providerIds: [],
      packIds: [],
      contributionIds: [],
      artifactPaths: [],
      routeIds: [],
      runtimeScopeIds: [],
      actionIds: [],
      workflowIds: [],
      relationshipIds: [],
      ruleIds: [],
      expectedState: '',
      observedState: diag.detail,
      missingEvidence: [],
      contradictionEvidence: [],
      traceability: [diag.code],
    });
  }

  if (input.compositionPlan) {
    for (const item of report.reconciliation ?? []) {
      if (item.status !== 'FULLY_RECONCILED' && item.status !== 'NOT_APPLICABLE' && item.status !== 'OPTIONAL_NOT_IMPLEMENTED') {
        add({
          diagnosticCode: item.status === 'UNDECLARED_CONTRIBUTION' ? 'undeclared_contribution' : 'contribution_missing',
          sourceAuthority: 'B10_RECONCILIATION',
          sourceEvaluationId: input.compositionPlan.compositionPlanId,
          sourceFingerprint: input.compositionPlan.planFingerprint,
          severity: 'BLOCKER',
          criticality: 'REQUIRED',
          readinessDimension: 'MATERIALIZATION_READINESS',
          requirementIds: item.requirementId ? [item.requirementId] : [],
          behaviorIds: [],
          capabilityKeys: item.capabilityKey ? [item.capabilityKey] : [],
          providerIds: item.providerId ? [item.providerId] : [],
          packIds: [],
          contributionIds: [],
          artifactPaths: [item.detail],
          routeIds: [],
          runtimeScopeIds: [],
          actionIds: [],
          workflowIds: [],
          relationshipIds: [],
          ruleIds: [],
          expectedState: 'FULLY_RECONCILED',
          observedState: item.status,
          missingEvidence: [],
          contradictionEvidence: [],
          traceability: [item.itemId],
        });
      }
    }
  }

  const traceabilityFile = input.workspaceFiles.find((f) =>
    f.relativePath.endsWith('contract-to-module-traceability-findings.json'),
  );
  if (traceabilityFile) {
    try {
      const traceFindings = JSON.parse(traceabilityFile.content) as {
        diagnosticCode: string;
        severity: string;
        moduleIds?: string[];
        conceptIds?: string[];
        artifactPaths?: string[];
        repairEligibility?: string;
        fingerprint?: string;
        observedState?: string;
      }[];
      for (const tf of traceFindings) {
        if (findings.some((f) => f.diagnosticCode === tf.diagnosticCode && f.moduleIds.join() === (tf.moduleIds ?? []).join())) continue;
        add({
          diagnosticCode: tf.diagnosticCode,
          sourceAuthority: 'CONTRACT_TO_MODULE_TRACEABILITY',
          sourceEvaluationId: 'cmt-evaluation',
          sourceFingerprint: tf.fingerprint ?? 'cmt',
          severity: tf.severity === 'BLOCKER' ? 'BLOCKER' : 'WARNING',
          criticality: tf.severity === 'BLOCKER' ? 'CRITICAL' : 'REQUIRED',
          readinessDimension: 'TRACEABILITY_READINESS',
          requirementIds: [],
          behaviorIds: [],
          capabilityKeys: [],
          providerIds: [],
          packIds: [],
          contributionIds: [],
          artifactPaths: tf.artifactPaths ?? [],
          routeIds: [],
          runtimeScopeIds: [],
          actionIds: [],
          workflowIds: [],
          relationshipIds: [],
          ruleIds: [],
          expectedState: 'TRACEABLE',
          observedState: tf.observedState ?? tf.repairEligibility ?? '',
          missingEvidence: [],
          contradictionEvidence: [],
          traceability: tf.conceptIds ?? [],
        });
      }
    } catch {
      /* structured traceability evidence only */
    }
  }

  return findings.sort((a, b) => a.findingId.localeCompare(b.findingId));
}
