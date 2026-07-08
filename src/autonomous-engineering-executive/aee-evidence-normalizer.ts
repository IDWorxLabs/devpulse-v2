/**
 * Autonomous Engineering Executive V1 — evidence normalizer.
 * Demotes authority STOP/BLOCK verdicts into normalized evidence recommendations.
 */

import type { AeeEvidenceResult, AeeExecutiveDecisionInput, AeeStage } from './aee-types.js';
import {
  isOverstrictPreBuildBlocker,
  isSafetyOrStructuralBlocker,
} from '../universal-build-pipeline-verification/build-continuation-policy.js';
import { buildEngineeringIntelligenceAeeEvidence } from '../engineering-intelligence-runtime/index.js';

function baseEvidence(
  authority: string,
  stage: AeeStage,
  reason: string,
  source: string,
  overrides: Partial<AeeEvidenceResult> = {},
): AeeEvidenceResult {
  return {
    readOnly: true,
    authority,
    stage,
    severity: 'WARNING',
    recommendation: 'CONTINUE',
    confidence: 0.5,
    reason,
    evidenceAvailable: [],
    evidenceMissing: [],
    canBlockContinuation: false,
    concreteBlocker: false,
    source,
    ...overrides,
  };
}

export function normalizeAseEvidence(input: {
  blockers: readonly string[];
  materializationAuthorized: boolean;
  materializationExecuted?: boolean;
  stage: AeeStage;
}): AeeEvidenceResult {
  const primary = input.blockers[0] ?? 'ASE materialization not authorized';
  const concrete = input.blockers.some(isSafetyOrStructuralBlocker);
  const overstrict = input.blockers.some(isOverstrictPreBuildBlocker);
  const materializationCompleted =
    input.materializationAuthorized && input.materializationExecuted !== false;

  if (materializationCompleted) {
    return baseEvidence('ASE', input.stage, 'ASE authorized materialization.', 'ase-enforcement-engine', {
      severity: 'INFO',
      recommendation: 'CONTINUE',
      confidence: 0.95,
      evidenceAvailable: ['materializationAuthorized'],
      canBlockContinuation: false,
    });
  }

  if (input.materializationAuthorized && input.materializationExecuted === false) {
    return baseEvidence(
      'ASE',
      input.stage,
      primary || 'ASE authorized materialization but execution did not complete.',
      'ase-enforcement-engine',
      {
        severity: overstrict ? 'WARNING' : 'ERROR',
        recommendation: concrete ? 'STOP' : overstrict ? 'CONTINUE' : 'RETRY',
        confidence: concrete ? 0.9 : overstrict ? 0.3 : 0.6,
        evidenceAvailable: ['materializationAuthorized'],
        evidenceMissing: ['materializationExecuted'],
        canBlockContinuation: concrete,
        concreteBlocker: concrete,
      },
    );
  }

  return baseEvidence('ASE', input.stage, primary, 'ase-enforcement-engine', {
    severity: concrete ? 'CRITICAL' : overstrict ? 'WARNING' : 'ERROR',
    recommendation: concrete ? 'STOP' : overstrict ? 'CONTINUE' : 'RETRY',
    confidence: concrete ? 0.9 : overstrict ? 0.3 : 0.6,
    evidenceAvailable: input.blockers.length ? ['aseBlockers'] : [],
    evidenceMissing: input.materializationAuthorized ? [] : ['materializationAuthorization'],
    canBlockContinuation: concrete,
    concreteBlocker: concrete,
  });
}

export function normalizeFeatureRealityEvidence(input: {
  status: string | null;
  stage: AeeStage;
}): AeeEvidenceResult {
  const degraded = input.status === 'DEGRADED_WITH_WORKSPACE_EVIDENCE';
  const passed = input.status === 'PASS' || degraded;
  const unavailable = !input.status || input.status === 'UNAVAILABLE';

  return baseEvidence(
    'Feature Reality',
    input.stage,
    unavailable
      ? 'Feature reality evidence unavailable — deferred until workspace materialization.'
      : `Feature reality status: ${input.status}`,
    'feature-contract-reality',
    {
      severity: degraded || unavailable ? 'WARNING' : passed ? 'INFO' : 'ERROR',
      recommendation: passed || degraded || unavailable ? 'CONTINUE' : 'REPAIR',
      confidence: passed ? 0.9 : degraded ? 0.75 : unavailable ? 0.4 : 0.5,
      evidenceAvailable: passed ? ['workspaceModules', 'registry', 'routes'] : degraded ? ['workspaceEvidence'] : [],
      evidenceMissing: unavailable ? ['runtimePlaywrightEvidence'] : [],
      canBlockContinuation: false,
      concreteBlocker: false,
    },
  );
}

export function normalizePromptFaithfulnessEvidence(input: {
  passed: boolean;
  score: number;
  stage: AeeStage;
  blockedReason?: string | null;
}): AeeEvidenceResult {
  return baseEvidence(
    'Prompt Faithfulness',
    input.stage,
    input.blockedReason ?? (input.passed ? 'Prompt faithfulness passed.' : 'Prompt faithfulness did not pass.'),
    'prompt-faithfulness-engine-v2',
    {
      severity: input.passed ? 'INFO' : 'CRITICAL',
      recommendation: input.passed ? 'CONTINUE' : 'STOP',
      confidence: input.passed ? Math.max(0.8, input.score / 100) : 0.95,
      evidenceAvailable: input.passed ? ['faithfulnessScore', 'approvedModules'] : [],
      evidenceMissing: input.passed ? [] : ['promptFaithfulnessPass'],
      canBlockContinuation: !input.passed,
      concreteBlocker: !input.passed,
    },
  );
}

export function normalizeLaunchReadinessEvidence(input: {
  blockers: readonly string[];
  stage: AeeStage;
}): AeeEvidenceResult {
  const concrete = input.blockers.some(isSafetyOrStructuralBlocker);
  return baseEvidence(
    'Launch Readiness',
    input.stage,
    input.blockers[0] ?? 'Launch readiness evidence collected.',
    'launch-readiness-authority-v2',
    {
      severity: input.blockers.length ? 'WARNING' : 'INFO',
      recommendation: concrete ? 'STOP' : 'CONTINUE',
      confidence: 0.5,
      evidenceAvailable: input.blockers.length ? [] : ['launchEvidence'],
      canBlockContinuation: false,
      concreteBlocker: concrete,
    },
  );
}

export function normalizeAuthorityEvidenceBundle(
  input: AeeExecutiveDecisionInput & { stage: AeeStage; faithfulnessPassed: boolean },
): readonly AeeEvidenceResult[] {
  const engineeringIntelligence =
    input.engineeringIntelligenceReport &&
    input.buildPlan.engineeringIntelligence?.contract
      ? buildEngineeringIntelligenceAeeEvidence({
          report: input.engineeringIntelligenceReport,
          fidelity: {
            readOnly: true,
            passed: input.engineeringIntelligenceFidelityPassed === true,
            verdict:
              input.engineeringIntelligenceFidelityPassed === true
                ? 'PASS'
                : input.engineeringIntelligenceReport.finalCapabilityCoverage === 'PARTIAL'
                  ? 'REPAIR'
                  : 'GAPS_REMAINING',
            productFidelityScore: input.engineeringIntelligenceReport.productFidelityScore,
            moduleContractStatus: input.engineeringIntelligenceReport.moduleContractStatus,
            mappedCapabilities: [],
            missingCapabilities: input.engineeringIntelligenceReport.missingCapabilities,
            missingModules: input.engineeringIntelligenceReport.missingCapabilities.flatMap((c) => [...c.moduleIds]),
            genericCollapseDetected:
              input.engineeringIntelligenceReport.moduleContractStatus === 'COLLAPSED_TO_GENERIC',
            profileContaminationDetected:
              input.engineeringIntelligenceReport.moduleContractStatus === 'PROFILE_CONTAMINATED',
            appRoutesProductFeatures: input.engineeringIntelligenceFidelityPassed === true,
            reasoning: `Product fidelity score ${input.engineeringIntelligenceReport.productFidelityScore}/100.`,
          },
          stage: input.stage,
          npmBuildOk: input.npmBuildOk === true,
          previewOk: input.previewOk === true,
        })
      : null;

  return [
    normalizeAseEvidence({
      blockers: input.aseBlockers,
      materializationAuthorized: input.aseMaterializationAuthorized,
      materializationExecuted: input.aseMaterializationExecuted,
      stage: input.stage,
    }),
    normalizeFeatureRealityEvidence({
      status: input.featureRealityStatus ?? null,
      stage: input.stage,
    }),
    normalizePromptFaithfulnessEvidence({
      passed: input.faithfulnessPassed,
      score: input.manifestFaithfulness?.score ?? input.buildPlan.promptFaithfulness.faithfulnessScore.overallScore * 100,
      stage: input.stage,
      blockedReason: input.buildPlan.promptFaithfulness.blockedReason,
    }),
    ...(engineeringIntelligence ? [engineeringIntelligence] : []),
    ...(() => {
      const safePayment = normalizeSafePaymentPlaceholderEvidence({
        rawPrompt: input.rawPrompt,
        buildPlan: input.buildPlan,
        stage: input.stage,
      });
      return safePayment ? [safePayment] : [];
    })(),
    normalizeLaunchReadinessEvidence({
      blockers: input.aseBlockers.filter((b) => /launch/i.test(b)),
      stage: input.stage,
    }),
    normalizeGenericAuthorityEvidence('Materialization Quality', input.stage, input.aseBlockers, 'materialization-quality-score'),
    normalizeGenericAuthorityEvidence('Founder Test', input.stage, input.aseBlockers, 'founder-test'),
    normalizeGenericAuthorityEvidence('Workspace Reality', input.stage, input.aseBlockers, 'workspace-reality-audit'),
    normalizeGenericAuthorityEvidence('Preview Reality', input.stage, input.aseBlockers, 'preview-reality'),
    normalizeGenericAuthorityEvidence('Production Proof', input.stage, input.aseBlockers, 'production-proof'),
  ];
}

function normalizeSafePaymentPlaceholderEvidence(input: {
  rawPrompt: string;
  buildPlan: AeeExecutiveDecisionInput['buildPlan'];
  stage: AeeStage;
}): AeeEvidenceResult | null {
  const placeholderActive =
    input.buildPlan.definition.safePaymentPlaceholderActive === true ||
    input.buildPlan.definition.paymentCapabilityClassification === 'SAFE_PAYMENT_PLACEHOLDER';

  if (!placeholderActive) return null;

  return baseEvidence(
    'Safe Payment Placeholder Policy',
    input.stage,
    'Safe payment placeholder active — materialization allowed without real transaction execution.',
    'safe-payment-placeholder-policy',
    {
      severity: 'INFO',
      recommendation: 'CONTINUE',
      confidence: 0.95,
      evidenceAvailable: ['SAFE_PAYMENT_PLACEHOLDER', 'placeholderNotice'],
      evidenceMissing: ['realPaymentIntegration'],
      canBlockContinuation: false,
      concreteBlocker: false,
    },
  );
}

function normalizeGenericAuthorityEvidence(
  authority: string,
  stage: AeeStage,
  blockers: readonly string[],
  source: string,
): AeeEvidenceResult {
  const relevant = blockers.filter((b) => b.toLowerCase().includes(authority.split(' ')[0]!.toLowerCase()));
  const concrete = relevant.some(isSafetyOrStructuralBlocker);
  return baseEvidence(
    authority,
    stage,
    relevant[0] ?? `${authority} evidence collected.`,
    source,
    {
      severity: relevant.length ? 'WARNING' : 'INFO',
      recommendation: concrete ? 'STOP' : 'CONTINUE',
      confidence: relevant.length ? 0.5 : 0.8,
      canBlockContinuation: false,
      concreteBlocker: concrete,
    },
  );
}
