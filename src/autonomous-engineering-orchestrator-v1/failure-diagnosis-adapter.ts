/**
 * Autonomous Engineering Orchestrator V1 — failure diagnosis adapter.
 *
 * Accepts evidence already produced by existing systems (build result normalizer, Product
 * Faithfulness v1/v2, Fresh Build Artifact Isolation, Project Context Isolation, Live Preview
 * Proof/Gate, Build Execution Stabilizer, Build Reality AutoFix, Autonomous Recovery Authority,
 * Autonomous Debugging Engine, validation/founder evidence reports, engineering report summary)
 * and normalizes it into the unified AEO failure taxonomy.
 *
 * This adapter never calls any of those systems, never re-runs a check, and never mutates
 * anything — it only reads the shapes it is given. Fields use minimal structural interfaces (not
 * the full imported types) on purpose: any real report object from those systems already
 * satisfies these shapes, so this module stays decoupled from their internals.
 */

import type { AeoBuildStage, AeoFailureClass } from './failure-taxonomy.js';
import { AEO_FAILURE_CLASS_METADATA } from './failure-taxonomy.js';
import type { AeoEvidenceCitation, AeoFailureClassification } from './autonomous-engineering-orchestrator-types.js';

/** Minimal shape of build-result-normalizer-v1's NormalizedBuildResult — read-only subset used here. */
export interface AeoNormalizedBuildResultEvidence {
  result: string;
  stages?: {
    workspaceReady?: boolean;
    dependenciesReady?: boolean;
    buildReady?: boolean;
    previewReady?: boolean;
    validationNeedsWork?: boolean;
  };
  summary?: { whatFailed?: string[]; headline?: string };
}

/** Minimal shape of product-faithfulness-v2's GenerationFaithfulnessReport. */
export interface AeoGenerationFaithfulnessEvidence {
  verdict: 'CONSISTENT' | 'DRIFTED' | 'SUBSTITUTED' | 'INCONSISTENT' | string;
  remainingMissingConcepts?: string[];
  unexpectedDominantConcepts?: string[];
  repairsPerformed?: Array<{ applied: boolean; detail: string }>;
  summary?: { headline?: string; reason?: string };
}

/** Minimal shape of product-faithfulness-v1's ProductFaithfulnessReport. */
export interface AeoProductFaithfulnessV1Evidence {
  verdict: 'PRODUCT_FAITHFUL' | 'PRODUCT_MOSTLY_FAITHFUL' | 'PARTIALLY_FAITHFUL' | 'LOW_FAITHFULNESS' | 'PRODUCT_MISMATCH' | string;
  summary?: { headline?: string; reason?: string };
}

/** Minimal shape of Fresh Build Artifact Isolation V4 evidence. */
export interface AeoFreshBuildArtifactIsolationEvidence {
  staleEvidenceDetected?: boolean;
  purgeActionsPerformed?: string[];
  summary?: string;
}

/** Minimal shape of Project Context Isolation V4 evidence. */
export interface AeoProjectContextIsolationEvidence {
  staleContextDetected?: boolean;
  buildDecisionKind?: string;
  summary?: string;
}

/** Minimal shape of Live Preview Interaction Proof evidence. */
export interface AeoLivePreviewProofEvidence {
  result: 'PREVIEW_INTERACTION_PASS' | 'PREVIEW_INTERACTION_PARTIAL' | 'PREVIEW_INTERACTION_FAIL' | 'PREVIEW_INTERACTION_BLOCKED' | string;
  summary?: { headline?: string; whatFailed?: string[] };
}

/** Minimal shape of Live Preview Gate evidence. */
export interface AeoLivePreviewGateEvidence {
  state?: string;
  livePreviewAvailable?: boolean;
  blockers?: string[];
}

/** Minimal shape of Build Execution Stabilizer V1's BuildExecutionReport. */
export interface AeoBuildExecutionEvidence {
  overallState: 'RUNNING' | 'WAITING' | 'STALL_DETECTED' | 'RECOVERING' | 'RECOVERED' | 'FAILED' | 'COMPLETED' | 'BLOCKED' | string;
  summary?: { headline?: string };
}

/** Minimal shape of Build Reality AutoFix's BuildRealityAutofixReport. */
export interface AeoBuildRealityAutofixEvidence {
  verdict: 'AUTOFIX_NOT_NEEDED' | 'AUTOFIX_REPAIRED' | 'AUTOFIX_BLOCKED' | 'AUTOFIX_EXHAUSTED' | 'AUTOFIX_UNSAFE' | string;
  primaryFailureClass?: string | null;
  finalValidationDetail?: string;
}

/** Minimal shape of Autonomous Recovery Authority's EngineeringRecoveryResult. */
export interface AeoAutonomousRecoveryEvidence {
  recovered: boolean;
  escalated: boolean;
  userActionRequired: boolean;
}

/** Minimal shape of Autonomous Debugging Engine pipeline output. */
export interface AeoAutonomousDebuggingEvidence {
  resolved?: boolean;
  summary?: string;
}

/** Minimal shape of a validation/founder evidence report. */
export interface AeoValidationFounderEvidence {
  passed?: boolean;
  blockers?: string[];
}

/**
 * Minimal shape of Generation Pipeline Compliance Authority V1's GpcaComplianceReport — read-only
 * subset used here, deliberately decoupled from that module's full type (same pattern as every
 * other evidence bridge in this file).
 */
export interface AeoGpcaComplianceEvidence {
  finalGateOutcome: string;
  blockedReasons?: readonly string[];
}

/** Maps a GPCA gate outcome string to the AEO failure class it should be diagnosed as. */
const GPCA_OUTCOME_TO_FAILURE_CLASS: Readonly<Record<string, AeoFailureClass>> = {
  COMPLIANCE_BLOCKED_LEGACY_GENERATOR: 'LEGACY_GENERATOR_DETECTED',
  COMPLIANCE_BLOCKED_TEMPLATE_GENERATOR: 'TEMPLATE_GENERATOR_DETECTED',
  COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS: 'BLUEPRINT_BYPASS',
  COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE: 'CONTRACT_TRACEABILITY_FAILURE',
  COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS: 'GENERATOR_INPUT_BYPASS',
  COMPLIANCE_BLOCKED_PIPELINE_NON_COMPLIANCE: 'PIPELINE_COMPLIANCE_FAILURE',
};

export interface AeoDiagnosisInput {
  rawFailureReason?: string | null;
  rawBuildOutput?: string | null;
  npmInstallOk?: boolean;
  npmBuildOk?: boolean;
  /** Explicit, evidence-driven signal — never inferred from a product name. */
  fallbackModulesDetected?: boolean;
  unauthorizedFallbackDetail?: string | null;
  normalizedBuildResult?: AeoNormalizedBuildResultEvidence | null;
  generationFaithfulnessReport?: AeoGenerationFaithfulnessEvidence | null;
  productFaithfulnessV1Report?: AeoProductFaithfulnessV1Evidence | null;
  freshBuildArtifactIsolation?: AeoFreshBuildArtifactIsolationEvidence | null;
  projectContextIsolation?: AeoProjectContextIsolationEvidence | null;
  livePreviewProof?: AeoLivePreviewProofEvidence | null;
  livePreviewGate?: AeoLivePreviewGateEvidence | null;
  buildExecutionReport?: AeoBuildExecutionEvidence | null;
  buildRealityAutofixReport?: AeoBuildRealityAutofixEvidence | null;
  autonomousRecoveryResult?: AeoAutonomousRecoveryEvidence | null;
  autonomousDebuggingReport?: AeoAutonomousDebuggingEvidence | null;
  validationFounderEvidence?: AeoValidationFounderEvidence | null;
  /** Free-text remaining gaps already surfaced by AEE/AEL engineering report summaries. */
  engineeringReportRemainingGaps?: readonly string[];
  /** Whether a repair was already attempted for the current failure and it did not resolve it. */
  priorRepairAttemptFailed?: boolean;
  /** Generation Pipeline Compliance Authority V1's final report for this build, when it ran. */
  gpcaComplianceReport?: AeoGpcaComplianceEvidence | null;
}

function citation(source: string, detail: string): AeoEvidenceCitation {
  return { readOnly: true, source, detail };
}

function classificationFor(
  failureClass: AeoFailureClass,
  evidence: AeoEvidenceCitation[],
  confidence: number,
  overrides?: { affectedStages?: AeoBuildStage[] },
): AeoFailureClassification {
  const meta = AEO_FAILURE_CLASS_METADATA[failureClass];
  return {
    readOnly: true,
    failureClass,
    severity: meta.defaultSeverity,
    confidence: Math.max(0, Math.min(100, confidence)),
    evidence,
    affectedStages: overrides?.affectedStages ?? meta.defaultAffectedStages,
    likelyOwnerSystem: meta.likelyOwnerSystem,
    repairMayBeAttempted: meta.repairMayBeAttempted,
    missingCapabilityPlanningMayBeNeeded: meta.missingCapabilityPlanningMayBeNeeded,
  };
}

const COMPILER_FAILURE_PATTERN = /\berror TS\d{4}\b|SyntaxError|Cannot find module|is not assignable to type|Unexpected token/i;
const DEPENDENCY_FAILURE_PATTERN = /npm (install|ci) failed|ENOENT|peer dep|ERESOLVE|package not found|E404/i;
const STALE_EVIDENCE_PATTERN = /stale evidence|stale.?context|STALE_EVIDENCE_BLOCKER/i;

/**
 * Diagnose a build failure from whatever evidence is available. Always returns at least one
 * classification (UNKNOWN_FAILURE when nothing matched). Order is deterministic: the same input
 * always produces the same ordered list, most-specific/most-severe signal first.
 */
export function diagnoseBuildFailure(input: AeoDiagnosisInput): AeoFailureClassification[] {
  const found: AeoFailureClassification[] = [];

  // 0. Generation Pipeline Compliance Authority V1 — the highest-priority signal of all: it only
  //    ever blocks a build once real generation stages have already been proven to bypass CBGA's
  //    approved plan or the canonical contract itself. This is checked before every other class.
  const gpca = input.gpcaComplianceReport;
  if (gpca && gpca.finalGateOutcome !== 'COMPLIANCE_ALLOWED') {
    const mappedClass = GPCA_OUTCOME_TO_FAILURE_CLASS[gpca.finalGateOutcome] ?? 'GENERATION_PIPELINE_NON_COMPLIANCE';
    found.push(
      classificationFor(
        mappedClass,
        [
          citation(
            'generation-pipeline-compliance-authority-v1',
            (gpca.blockedReasons ?? []).join(' ') || `GPCA final gate outcome: ${gpca.finalGateOutcome}`,
          ),
        ],
        95,
      ),
    );
  }

  // 1. Unauthorized fallback modules — highest priority: this is a product-integrity violation,
  //    not a technical build error, and must never be silently folded into a generic failure.
  if (input.fallbackModulesDetected || /fallback module/i.test(input.unauthorizedFallbackDetail ?? '')) {
    found.push(
      classificationFor(
        'UNAUTHORIZED_FALLBACK_MODULES',
        [
          citation(
            'universal-prompt-to-app-materialization',
            input.unauthorizedFallbackDetail ?? 'Fallback modules were appended to the custom module definition.',
          ),
        ],
        95,
      ),
    );
  }

  // 2. Product identity drift — Product Faithfulness V2 found the identity was substituted or the
  //    audit itself became internally inconsistent while generating.
  const genReport = input.generationFaithfulnessReport;
  if (genReport?.verdict === 'SUBSTITUTED') {
    found.push(
      classificationFor(
        'PRODUCT_IDENTITY_DRIFT',
        [citation('product-faithfulness-v2', genReport.summary?.reason ?? 'Product identity drifted during generation (concept substitution detected).')],
        90,
      ),
    );
  } else if (input.productFaithfulnessV1Report?.verdict === 'PRODUCT_MISMATCH') {
    found.push(
      classificationFor(
        'PRODUCT_IDENTITY_DRIFT',
        [citation('product-faithfulness-v1', input.productFaithfulnessV1Report.summary?.reason ?? 'Finished app does not match the requested product.')],
        80,
      ),
    );
  }

  if (genReport?.verdict === 'INCONSISTENT') {
    found.push(
      classificationFor(
        'CONTRACT_INCONSISTENCY',
        [citation('product-faithfulness-v2', genReport.summary?.reason ?? 'Generation stages became inconsistent with the canonical product contract.')],
        88,
      ),
    );
  }

  // 3. Stale evidence — Fresh Build Artifact Isolation V4, or a normalized-result/raw-text signal.
  if (input.freshBuildArtifactIsolation?.staleEvidenceDetected) {
    found.push(
      classificationFor(
        'STALE_EVIDENCE_FAILURE',
        [citation('fresh-build-artifact-isolation-v4', input.freshBuildArtifactIsolation.summary ?? 'Stale evidence from a prior build was detected in the current runtime evidence scope.')],
        85,
      ),
    );
  } else if (STALE_EVIDENCE_PATTERN.test(input.rawFailureReason ?? '') || STALE_EVIDENCE_PATTERN.test(input.rawBuildOutput ?? '')) {
    found.push(
      classificationFor(
        'STALE_EVIDENCE_FAILURE',
        [citation('build-result-normalizer-v1', input.rawFailureReason ?? 'Stale evidence blocked the build result.')],
        70,
      ),
    );
  }

  // 4. Project context failure — stale/ambiguous new-build-vs-continue context.
  if (input.projectContextIsolation?.staleContextDetected) {
    found.push(
      classificationFor(
        'PROJECT_CONTEXT_FAILURE',
        [citation('project-context-isolation-v4', input.projectContextIsolation.summary ?? 'Stale project context was detected before generation started.')],
        80,
      ),
    );
  }

  // 5. Live preview proof / preview runtime failures.
  const proof = input.livePreviewProof;
  if (proof && (proof.result === 'PREVIEW_INTERACTION_FAIL' || proof.result === 'PREVIEW_INTERACTION_BLOCKED')) {
    found.push(
      classificationFor(
        'LIVE_PREVIEW_PROOF_FAILURE',
        [citation('live-preview-interaction-proof-v1', proof.summary?.headline ?? 'Live preview interaction proof failed or was blocked.')],
        82,
      ),
    );
  } else if (input.buildExecutionReport && (input.buildExecutionReport.overallState === 'FAILED' || input.buildExecutionReport.overallState === 'BLOCKED')) {
    found.push(
      classificationFor(
        'PREVIEW_RUNTIME_FAILURE',
        [citation('build-execution-stabilizer-v1', input.buildExecutionReport.summary?.headline ?? 'Build execution stopped responding and did not recover.')],
        75,
      ),
    );
  } else if (input.livePreviewGate && input.livePreviewGate.livePreviewAvailable === false && (input.livePreviewGate.blockers?.length ?? 0) > 0) {
    found.push(
      classificationFor(
        'PREVIEW_RUNTIME_FAILURE',
        [citation('live-preview-gate', input.livePreviewGate.blockers!.join('; '))],
        65,
      ),
    );
  }

  // 6. Compiler / dependency failures.
  const combinedText = `${input.rawFailureReason ?? ''} ${input.rawBuildOutput ?? ''}`;
  if (input.npmInstallOk === false || DEPENDENCY_FAILURE_PATTERN.test(combinedText)) {
    found.push(
      classificationFor(
        'DEPENDENCY_INSTALL_FAILURE',
        [citation('build-result-normalizer-v1', input.rawFailureReason ?? 'npm install failed.')],
        85,
      ),
    );
  } else if (input.npmBuildOk === false || COMPILER_FAILURE_PATTERN.test(combinedText)) {
    found.push(
      classificationFor(
        'COMPILER_FAILURE',
        [citation('autonomous-engineering-executive (aee-build-autofix-loop)', input.rawBuildOutput || input.rawFailureReason || 'The generated app did not compile.')],
        85,
      ),
    );
  }

  // 7. Build Reality AutoFix already tried and gave up.
  if (input.buildRealityAutofixReport?.verdict === 'AUTOFIX_EXHAUSTED' || input.buildRealityAutofixReport?.verdict === 'AUTOFIX_UNSAFE') {
    found.push(
      classificationFor(
        'REPAIR_FAILED',
        [citation('build-reality-autofix-engine-v1', input.buildRealityAutofixReport.finalValidationDetail ?? `Build Reality AutoFix reached verdict ${input.buildRealityAutofixReport.verdict}.`)],
        70,
      ),
    );
  }

  if (input.autonomousRecoveryResult?.escalated) {
    found.push(
      classificationFor(
        'REPAIR_FAILED',
        [citation('autonomous-recovery-authority', 'Autonomous Recovery Authority escalated — no remaining recovery strategy succeeded.')],
        70,
      ),
    );
  }

  // 8. Validation-only failures (no build/preview symptom, only validators flagged something).
  if (input.normalizedBuildResult?.stages?.validationNeedsWork && found.length === 0) {
    found.push(
      classificationFor(
        'VALIDATION_FAILURE',
        [citation('build-result-normalizer-v1', input.normalizedBuildResult.summary?.headline ?? 'Validation checks flagged issues.')],
        60,
      ),
    );
  }
  if (input.validationFounderEvidence?.passed === false && found.length === 0) {
    found.push(
      classificationFor(
        'VALIDATION_FAILURE',
        [citation('founder-testing-mode', (input.validationFounderEvidence.blockers ?? []).join('; ') || 'Founder validation evidence reported a failure.')],
        55,
      ),
    );
  }

  if (input.engineeringReportRemainingGaps && input.engineeringReportRemainingGaps.length > 0 && found.length === 0) {
    found.push(
      classificationFor(
        'MODULE_GENERATION_FAILURE',
        input.engineeringReportRemainingGaps.map((gap) => citation('autonomous-engineering-executive / autonomous-engineering-loop', gap)),
        50,
      ),
    );
  }

  if (input.priorRepairAttemptFailed && found.length === 0) {
    found.push(
      classificationFor(
        'REPAIR_FAILED',
        [citation('autonomous-engineering-orchestrator-v1', 'A prior repair attempt for this failure did not resolve it.')],
        60,
      ),
    );
  }

  if (found.length === 0) {
    found.push(
      classificationFor(
        'UNKNOWN_FAILURE',
        [citation('autonomous-engineering-orchestrator-v1', input.rawFailureReason || input.rawBuildOutput || 'No evidence source classified this failure.')],
        20,
      ),
    );
  }

  return found.sort((a, b) => b.confidence - a.confidence);
}

/** The single most important classification to act on — always the highest-confidence entry. */
export function selectPrimaryFailureClassification(classifications: AeoFailureClassification[]): AeoFailureClassification {
  if (classifications.length === 0) {
    return classificationFor('UNKNOWN_FAILURE', [citation('autonomous-engineering-orchestrator-v1', 'No classifications produced.')], 0);
  }
  return classifications[0];
}
