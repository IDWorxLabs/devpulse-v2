/**
 * Universal Production Readiness Verification V1 — orchestrator.
 */

import { createHash } from 'node:crypto';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import {
  loadProductionReadinessInput,
  buildReadinessFingerprints,
} from './production-readiness-input-loader.js';
import { validateProductionReadinessInput } from './production-readiness-input-validator.js';
import { evaluateContractFaithfulness } from './production-readiness-contract-faithfulness.js';
import { evaluateCompositionReadiness } from './production-readiness-composition-validator.js';
import { evaluateMaterializationReadiness, buildProductionReconciliation } from './production-readiness-materialization-reconciler.js';
import {
  evaluateCrudReadiness,
  evaluateActionReadiness,
  evaluateWorkflowReadiness,
  evaluateRelationshipReadiness,
  evaluateRuleReadiness,
  evaluateRuntimeReadiness,
  evaluatePersistenceReadiness,
  evaluateDataIntegrityReadiness,
  evaluateNavigationReadiness,
  evaluatePackReadiness,
  evaluateBuildReadiness,
  evaluatePreviewReadiness,
  evaluateDiagnosticReadiness,
} from './production-readiness-dimension-evaluator.js';
import { evaluateBehavioralReadiness } from './production-readiness-behavior-validator.js';
import { evaluateCapabilityReadiness } from './production-readiness-capability-validator.js';
import { evaluateEvidenceIntegrity } from './production-readiness-evidence-integrity.js';
import { evaluateTraceabilityReadiness } from './production-readiness-traceability.js';
import { calculateReadinessScore } from './production-readiness-score.js';
import { classifyReadinessVerdict, inspectReadinessBlockers, inspectReadinessWarnings } from './production-readiness-verdict.js';
import { classifyReleaseDecision } from './production-readiness-release-decision.js';
import { generateProductionReadinessReport } from './production-readiness-report.js';
import type {
  ProductionReadinessInput,
  ProductionReadinessReport,
  ReadinessDimensionId,
  UniversalProductionReadinessDescriptor,
} from './universal-production-readiness-types.js';
import {
  UNIVERSAL_PRODUCTION_READINESS_SOURCE,
  UNIVERSAL_PRODUCTION_READINESS_VERSION,
} from './universal-production-readiness-types.js';

const ALL_DIMENSIONS: readonly ReadinessDimensionId[] = [
  'CONTRACT_FAITHFULNESS',
  'COMPOSITION_READINESS',
  'MATERIALIZATION_READINESS',
  'RUNTIME_READINESS',
  'BEHAVIORAL_READINESS',
  'CAPABILITY_READINESS',
  'CRUD_READINESS',
  'ACTION_READINESS',
  'WORKFLOW_READINESS',
  'RELATIONSHIP_READINESS',
  'BUSINESS_RULE_READINESS',
  'PERSISTENCE_READINESS',
  'DATA_INTEGRITY_READINESS',
  'NAVIGATION_READINESS',
  'CAPABILITY_PACK_READINESS',
  'BUILD_READINESS',
  'PREVIEW_READINESS',
  'EVIDENCE_INTEGRITY',
  'TRACEABILITY_READINESS',
  'DIAGNOSTIC_READINESS',
];

export function fingerprintReadinessDecision(evaluation: UniversalProductionReadinessDescriptor): string {
  const parts = [
    evaluation.readinessEvaluationId,
    evaluation.envelopeFingerprint,
    evaluation.compositionPlanFingerprint,
    evaluation.readinessVerdict,
    evaluation.releaseDecision,
    String(evaluation.productionReadinessScore),
    ...evaluation.blockingFindings.map((f) => f.code).sort(),
  ];
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
}

export function evaluateProductionReadiness(input: ProductionReadinessInput): ProductionReadinessReport {
  const inputErrors = validateProductionReadinessInput(input);
  const fingerprints = buildReadinessFingerprints(input);

  const dimensionResults = [
    evaluateContractFaithfulness(input),
    evaluateCompositionReadiness(input),
    evaluateMaterializationReadiness(input),
    evaluateRuntimeReadiness(input),
    evaluateBehavioralReadiness(input),
    evaluateCapabilityReadiness(input),
    evaluateCrudReadiness(input),
    evaluateActionReadiness(input),
    evaluateWorkflowReadiness(input),
    evaluateRelationshipReadiness(input),
    evaluateRuleReadiness(input),
    evaluatePersistenceReadiness(input),
    evaluateDataIntegrityReadiness(input),
    evaluateNavigationReadiness(input),
    evaluatePackReadiness(input),
    evaluateBuildReadiness(input),
    evaluatePreviewReadiness(input),
    evaluateEvidenceIntegrity(input),
    evaluateTraceabilityReadiness(input),
    evaluateDiagnosticReadiness(input),
  ];

  const allFindings = dimensionResults.flatMap((d) => d.findings);
  const blockers = inspectReadinessBlockers(allFindings);
  const warnings = inspectReadinessWarnings(allFindings);
  const informational = allFindings.filter((f) => f.severity === 'INFORMATIONAL');
  const scores = calculateReadinessScore(dimensionResults);
  const verdict = classifyReadinessVerdict({ inputErrors, blockers, warnings, scores, readinessInput: input });
  const releaseDecision = classifyReleaseDecision(verdict, blockers, warnings);
  const reconciliation = buildProductionReconciliation(input);

  const plan = input.compositionPlan;
  const verifiedRequirements = plan?.providerAssignments.filter((a) => a.outcome === 'SATISFIED').map((a) => a.requirementId) ?? [];
  const unresolvedRequirements = plan?.unresolvedRequirements ?? [];
  const blockedRequirements = plan?.blockedRequirements ?? [];

  const evaluationBase: Omit<UniversalProductionReadinessDescriptor, 'fingerprint'> = {
    readOnly: true,
    readinessEvaluationId: `${input.contractId}-readiness-${fingerprints.generatedWorkspaceFingerprint.slice(0, 8)}`,
    applicationId: input.contractId,
    envelopeFingerprint: fingerprints.envelopeFingerprint,
    compositionPlanFingerprint: fingerprints.compositionPlanFingerprint,
    generatedWorkspaceFingerprint: fingerprints.generatedWorkspaceFingerprint,
    behaviorReportFingerprint: fingerprints.behaviorReportFingerprint,
    capabilityCoverageFingerprint: fingerprints.capabilityCoverageFingerprint,
    evaluatedAt: input.envelope.generatedAt,
    evaluatorVersion: UNIVERSAL_PRODUCTION_READINESS_VERSION,
    requiredReadinessDimensions: ALL_DIMENSIONS,
    dimensionResults,
    blockingFindings: blockers,
    warningFindings: warnings,
    informationalFindings: informational,
    missingEvidence: inputErrors,
    contradictoryEvidence: [],
    unresolvedRequirements,
    verifiedRequirements,
    productionReadinessScore: scores.overallReadinessScore,
    behavioralReadinessScore: scores.behavioralReadinessScore,
    capabilityReadinessScore: scores.capabilityReadinessScore,
    materializationReadinessScore: scores.materializationReadinessScore,
    dataReadinessScore: scores.dataReadinessScore,
    runtimeReadinessScore: scores.runtimeReadinessScore,
    readinessVerdict: verdict,
    releaseDecision,
    scores,
    reconciliation,
    provenance: [UNIVERSAL_PRODUCTION_READINESS_SOURCE, input.contractId],
  };

  const evaluation: UniversalProductionReadinessDescriptor = Object.freeze({
    ...evaluationBase,
    fingerprint: fingerprintReadinessDecision({ ...evaluationBase, fingerprint: '' }),
  }) as UniversalProductionReadinessDescriptor;

  return generateProductionReadinessReport(evaluation, input);
}

export function requireProductionReadyBuild(
  evaluation: UniversalProductionReadinessDescriptor | ProductionReadinessReport | null | undefined,
): UniversalProductionReadinessDescriptor {
  if (!evaluation) {
    throw new Error('production_readiness_input_invalid:missing_evaluation');
  }
  if (!evaluation.fingerprint) {
    throw new Error('production_readiness_input_invalid:missing_fingerprint');
  }
  if (evaluation.readinessVerdict !== 'PRODUCTION_READY' && evaluation.readinessVerdict !== 'CONDITIONALLY_READY') {
    throw new Error(`release_blocked:${evaluation.readinessVerdict}:${evaluation.blockingFindings.map((f) => f.code).join(',')}`);
  }
  if (evaluation.blockingFindings.length > 0 && evaluation.readinessVerdict === 'PRODUCTION_READY') {
    throw new Error('false_production_readiness:blockers_present');
  }
  return evaluation;
}

export function reconcileProductionEvidence(input: ProductionReadinessInput) {
  return buildProductionReconciliation(input);
}

export function runProductionReadinessEvaluation(input: {
  envelope: ApprovedProductionBuildEnvelope;
  workspaceFiles: readonly GeneratedWorkspaceFile[];
  moduleIds: readonly string[];
  contractId: string;
}): ProductionReadinessReport {
  const readinessInput = loadProductionReadinessInput(input);
  return evaluateProductionReadiness(readinessInput);
}

export {
  UNIVERSAL_PRODUCTION_READINESS_VERSION,
  UNIVERSAL_PRODUCTION_READINESS_SOURCE,
};
