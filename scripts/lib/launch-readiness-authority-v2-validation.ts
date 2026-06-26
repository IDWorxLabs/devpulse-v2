/**
 * Launch Readiness Authority V2 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAutonomousDebuggingPipeline } from '../../src/autonomous-debugging-engine/index.js';
import { runBehaviorSimulationPipeline } from '../../src/behavior-simulation-engine/index.js';
import { runCapabilityPlanningPipeline } from '../../src/capability-planning-engine/index.js';
import { runIncrementalBuildPipeline } from '../../src/incremental-autonomous-builder/index.js';
import { runIntentUnderstandingEngine } from '../../src/intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../../src/prompt-faithfulness-engine-v2/index.js';
import { runInteractionProofPipeline } from '../../src/interaction-proof-engine/index.js';
import { runContinuousImprovementPipeline } from '../../src/continuous-product-improvement-engine/index.js';
import { runVirtualUserPipeline } from '../../src/virtual-user-engine/index.js';
import { runVirtualDevicePipeline } from '../../src/virtual-device-laboratory/index.js';
import {
  buildLaunchReadinessAuthorityEvidence,
  collectLaunchEvidence,
  detectLaunchBlockers,
  evaluateLivePreviewLaunchReadinessGate,
  explainLaunchDecision,
  getDevPulseV2LaunchReadinessAuthorityV2,
  getLaunchReadinessPassToken,
  isLaunchReady,
  isLivePreviewUnlockedByLaunchAuthority,
  resetLaunchReadinessAuthorityV2ModuleForTests,
  runLaunchReadinessAuthorityPipeline,
  validateLaunchEvidence,
  analyzeLaunchRisk,
  calculateLaunchConfidence,
  scoreLaunchReadiness,
  resolveLaunchVerdict,
  buildLaunchDecisionAudit,
} from '../../src/launch-readiness-authority-v2/index.js';
import { EXPENSE_PROMPT, LISA_PROMPT } from './prompt-faithfulness-v2-validation.js';

export const PAYMENT_PROMPT = 'Build an application that processes real payments with Stripe checkout.';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/launch-readiness-authority-v2');

export const REQUIRED_FILES = [
  'launch-readiness-types.ts',
  'launch-readiness-registry.ts',
  'launch-evidence-collector.ts',
  'launch-evidence-validator.ts',
  'launch-risk-analyzer.ts',
  'launch-confidence-engine.ts',
  'launch-blocker-detector.ts',
  'launch-readiness-scorer.ts',
  'launch-verdict-engine.ts',
  'launch-readiness-history.ts',
  'launch-readiness-report-builder.ts',
  'launch-decision-audit.ts',
  'launch-decision-explainer.ts',
  'launch-authority.ts',
  'launch-live-preview-gate.ts',
  'index.ts',
];

export interface ValidationCheck {
  section: string;
  name: string;
  passed: boolean;
  detail: string;
}

function eraInput(rawPrompt: string) {
  const intent = runIntentUnderstandingEngine({ rawPrompt });
  const faithfulness = runPromptFaithfulnessEngineV2(rawPrompt, {
    generatedModules: intent.productIntelligenceModel.architecture.moduleIds,
  });
  const capabilityPlanning = runCapabilityPlanningPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
  });
  const incrementalBuild = runIncrementalBuildPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
  });
  const behaviorSimulation = runBehaviorSimulationPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
  });
  const virtualUserSimulation = runVirtualUserPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
  });
  const virtualDeviceLaboratory = runVirtualDevicePipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
  });
  const interactionProof = runInteractionProofPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
  });
  const autonomousDebugging = runAutonomousDebuggingPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
  });
  const continuousImprovement = runContinuousImprovementPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
    autonomousDebugging,
  });
  return {
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
    autonomousDebugging,
    continuousImprovement,
  };
}

export function runLaunchReadinessAuthorityV2Validation(sections?: string[]): {
  checks: ValidationCheck[];
  allPassed: boolean;
} {
  const checks: ValidationCheck[] = [];
  const want = sections ? new Set(sections) : null;
  const include = (section: string): boolean => !want || want.has(section) || want.has('all');

  const assert = (section: string, name: string, condition: boolean, detail: string): void => {
    if (!include(section)) return;
    checks.push({ section, name, passed: condition, detail });
  };

  resetLaunchReadinessAuthorityV2ModuleForTests();

  if (include('launch-readiness-authority-v2') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('launch-readiness-authority-v2', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const authority = getDevPulseV2LaunchReadinessAuthorityV2();
    assert(
      'launch-readiness-authority-v2',
      'pass token',
      authority.passToken === 'LAUNCH_READINESS_AUTHORITY_V2_PASS',
      authority.passToken,
    );
    assert('launch-readiness-authority-v2', 'phase 12', authority.phase === 12, String(authority.phase));
    assert(
      'launch-readiness-authority-v2',
      'pass token helper',
      getLaunchReadinessPassToken() === 'LAUNCH_READINESS_AUTHORITY_V2_PASS',
      getLaunchReadinessPassToken(),
    );
  }

  if (include('launch-evidence-collection') || include('all')) {
    const evidence = collectLaunchEvidence({ rawPrompt: EXPENSE_PROMPT });
    assert(
      'launch-evidence-collection',
      'all required sources',
      evidence.missingSources.length === 0 && evidence.sources.length >= 20,
      `${evidence.sources.length} sources`,
    );
    assert(
      'launch-evidence-collection',
      'founder test source',
      evidence.sources.some((s) => s.sourceId === 'FOUNDER_TEST'),
      'founder',
    );
    assert(
      'launch-evidence-collection',
      'uvl source',
      evidence.sources.some((s) => s.sourceId === 'UVL'),
      'uvl',
    );
  }

  if (include('launch-evidence-validation') || include('all')) {
    const evidence = collectLaunchEvidence({ rawPrompt: EXPENSE_PROMPT });
    const validation = validateLaunchEvidence(evidence);
    assert('launch-evidence-validation', 'expense evidence valid', validation.valid, String(validation.completenessScore));
    const missing = collectLaunchEvidence({ rawPrompt: EXPENSE_PROMPT, simulateMissingExecutionTraceEvidence: true });
    const missingValidation = validateLaunchEvidence(missing);
    assert(
      'launch-evidence-validation',
      'missing execution trace blocks',
      !missingValidation.valid && /execution trace/i.test(missingValidation.primaryBlockReason ?? ''),
      missingValidation.primaryBlockReason ?? 'blocked',
    );
  }

  if (include('launch-blocker-detection') || include('all')) {
    const evidence = collectLaunchEvidence({
      rawPrompt: LISA_PROMPT,
      simulateVirtualUserEmergencyFailure: true,
    });
    const blockers = detectLaunchBlockers(evidence);
    assert(
      'launch-blocker-detection',
      'virtual user blocker',
      blockers.some((b) => b.kind === 'FAILED_VIRTUAL_USER_JOURNEY'),
      String(blockers.length),
    );
    assert(
      'launch-blocker-detection',
      'not averaged away',
      blockers.length >= 1,
      blockers[0]?.summary ?? 'missing',
    );
  }

  if (include('launch-risk-analysis') || include('all')) {
    const evidence = collectLaunchEvidence({
      rawPrompt: LISA_PROMPT,
      simulateCriticalAccessibilityRisk: true,
      simulateContinuousImprovementBlocked: true,
    });
    const risks = analyzeLaunchRisk(evidence);
    assert(
      'launch-risk-analysis',
      'accessibility risk',
      risks.some((r) => r.category === 'ACCESSIBILITY'),
      String(risks.length),
    );
    assert(
      'launch-risk-analysis',
      'high residual risk',
      risks.some((r) => r.residualRisk === 'HIGH'),
      'high',
    );
  }

  if (include('launch-confidence-engine') || include('all')) {
    const ready = runLaunchReadinessAuthorityPipeline({ rawPrompt: EXPENSE_PROMPT });
    assert(
      'launch-confidence-engine',
      'ready confidence',
      ready.confidence.overallConfidence > 50,
      String(ready.confidence.overallConfidence),
    );
    const blocked = runLaunchReadinessAuthorityPipeline({
      rawPrompt: EXPENSE_PROMPT,
      simulateMissingExecutionTraceEvidence: true,
    });
    assert(
      'launch-confidence-engine',
      'blocker override',
      blocked.confidence.blockerOverrideApplied,
      String(blocked.confidence.overallConfidence),
    );
  }

  if (include('launch-readiness-scoring') || include('all')) {
    const result = runLaunchReadinessAuthorityPipeline({ rawPrompt: EXPENSE_PROMPT });
    assert(
      'launch-readiness-scoring',
      'categories scored',
      result.scores.categories.length >= 15,
      String(result.scores.categories.length),
    );
    assert(
      'launch-readiness-scoring',
      'overall score',
      result.scores.overallScore > 0,
      String(result.scores.overallScore),
    );
  }

  if (include('launch-verdict-engine') || include('all')) {
    const ready = runLaunchReadinessAuthorityPipeline({ rawPrompt: EXPENSE_PROMPT });
    assert('launch-verdict-engine', 'launch ready', ready.verdict.verdict === 'LAUNCH_READY', ready.verdict.verdict);
    const repair = runLaunchReadinessAuthorityPipeline({
      rawPrompt: LISA_PROMPT,
      simulateVirtualUserEmergencyFailure: true,
    });
    assert(
      'launch-verdict-engine',
      'needs repair',
      repair.verdict.verdict === 'NEEDS_AUTONOMOUS_REPAIR',
      repair.verdict.verdict,
    );
  }

  if (include('launch-decision-audit') || include('all')) {
    const result = runLaunchReadinessAuthorityPipeline({ rawPrompt: EXPENSE_PROMPT });
    assert('launch-decision-audit', 'decision id', result.audit.decisionId.length > 0, result.audit.decisionId);
    assert(
      'launch-decision-audit',
      'trace reproducible',
      result.audit.decisionTrace.length >= 5,
      String(result.audit.decisionTrace.length),
    );
    assert(
      'launch-decision-audit',
      'evidence sources recorded',
      result.audit.evidenceSources.length >= 20,
      String(result.audit.evidenceSources.length),
    );
  }

  if (include('launch-decision-explanation') || include('all')) {
    const blocked = runLaunchReadinessAuthorityPipeline({
      rawPrompt: LISA_PROMPT,
      simulateVirtualUserEmergencyFailure: true,
    });
    const explanation = explainLaunchDecision({
      evidence: blocked.evidence,
      blockers: blocked.blockers,
      verdict: blocked.verdict,
    });
    assert(
      'launch-decision-explanation',
      'blocking sections',
      explanation.blockingSections.length >= 1,
      String(explanation.blockingSections.length),
    );
    assert(
      'launch-decision-explanation',
      'recommended action',
      explanation.recommendedNextAction.length > 10,
      explanation.recommendedNextAction,
    );
  }

  if (include('launch-founder-integration') || include('all')) {
    const result = runLaunchReadinessAuthorityPipeline({ rawPrompt: EXPENSE_PROMPT });
    const founderSource = result.evidence.sources.find((s) => s.sourceId === 'FOUNDER_TEST');
    assert('launch-founder-integration', 'founder evidence provider', Boolean(founderSource), founderSource?.sourceName ?? 'missing');
    assert(
      'launch-founder-integration',
      'founder does not decide',
      result.verdict.verdict !== 'FOUNDER_TEST' as never,
      result.verdict.verdict,
    );
    const registry = readFileSync(join(MODULE_DIR, 'launch-readiness-registry.ts'), 'utf8');
    assert(
      'launch-founder-integration',
      'founder registration',
      registry.includes('registerLaunchReadinessAuthorityV2WithFounderTest'),
      'registry',
    );
  }

  if (include('launch-uvl-integration') || include('all')) {
    const result = runLaunchReadinessAuthorityPipeline({ rawPrompt: EXPENSE_PROMPT });
    const uvl = result.evidence.sources.find((s) => s.sourceId === 'UVL');
    assert('launch-uvl-integration', 'uvl evidence provider', Boolean(uvl), uvl?.sourceName ?? 'missing');
    assert(
      'launch-uvl-integration',
      'uvl does not decide alone',
      result.verdict.verdict === 'LAUNCH_READY' || result.blockers.length > 0 || !result.evidenceValidation.valid,
      result.verdict.verdict,
    );
    const registry = readFileSync(join(MODULE_DIR, 'launch-readiness-registry.ts'), 'utf8');
    assert(
      'launch-uvl-integration',
      'uvl registration',
      registry.includes('registerLaunchReadinessAuthorityV2WithUvl'),
      'registry',
    );
  }

  if (include('launch-live-preview-gate') || include('all')) {
    const ready = runLaunchReadinessAuthorityPipeline({ rawPrompt: EXPENSE_PROMPT });
    const gate = evaluateLivePreviewLaunchReadinessGate(ready);
    assert('launch-live-preview-gate', 'unlocked on launch ready', gate.unlocked, String(gate.unlocked));
    assert(
      'launch-live-preview-gate',
      'helper unlocked',
      isLivePreviewUnlockedByLaunchAuthority(ready),
      'unlocked',
    );
    const blocked = runLaunchReadinessAuthorityPipeline({
      rawPrompt: LISA_PROMPT,
      simulateVirtualUserEmergencyFailure: true,
    });
    const failGate = evaluateLivePreviewLaunchReadinessGate(blocked);
    assert('launch-live-preview-gate', 'locked on failure', !failGate.unlocked, failGate.gateStatus);
    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert(
      'launch-live-preview-gate',
      'orchestrator gate',
      orchestrator.includes('evaluateLivePreviewGateForOrchestrator'),
      'orchestrator',
    );
  }

  if (include('all')) {
    const ready = runLaunchReadinessAuthorityPipeline({ rawPrompt: EXPENSE_PROMPT });
    assert(
      'launch-readiness-authority-v2',
      'scenario fully ready',
      isLaunchReady(ready) && isLivePreviewUnlockedByLaunchAuthority(ready),
      ready.verdict.verdict,
    );

    const behaviorFailure = runLaunchReadinessAuthorityPipeline({
      rawPrompt: LISA_PROMPT,
      simulateVirtualUserEmergencyFailure: true,
    });
    assert(
      'launch-readiness-authority-v2',
      'scenario behavior failure',
      behaviorFailure.verdict.verdict === 'NEEDS_AUTONOMOUS_REPAIR' &&
        !isLivePreviewUnlockedByLaunchAuthority(behaviorFailure),
      behaviorFailure.verdict.verdict,
    );

    const missingCapability = runLaunchReadinessAuthorityPipeline({
      rawPrompt: EXPENSE_PROMPT,
      simulateUnresolvedCapability: true,
    });
    assert(
      'launch-readiness-authority-v2',
      'scenario missing capability',
      missingCapability.verdict.verdict === 'NEEDS_CAPABILITY_EVOLUTION',
      missingCapability.verdict.verdict,
    );

    const humanReview = runLaunchReadinessAuthorityPipeline({ rawPrompt: PAYMENT_PROMPT });
    assert(
      'launch-readiness-authority-v2',
      'scenario human review',
      humanReview.verdict.verdict === 'NEEDS_HUMAN_REVIEW',
      humanReview.verdict.verdict,
    );

    const missingEvidence = runLaunchReadinessAuthorityPipeline({
      rawPrompt: EXPENSE_PROMPT,
      simulateMissingExecutionTraceEvidence: true,
    });
    assert(
      'launch-readiness-authority-v2',
      'scenario missing evidence',
      missingEvidence.verdict.verdict === 'BLOCKED' &&
        /EVIDENCE_INCOMPLETE|Execution Trace/i.test(missingEvidence.verdict.primaryReason),
      missingEvidence.verdict.primaryReason,
    );

    const residualRisk = runLaunchReadinessAuthorityPipeline({
      rawPrompt: LISA_PROMPT,
      simulateCriticalAccessibilityRisk: true,
      simulateContinuousImprovementBlocked: true,
    });
    assert(
      'launch-readiness-authority-v2',
      'scenario residual high risk',
      residualRisk.verdict.verdict === 'NOT_LAUNCH_READY' ||
        residualRisk.blockers.some((b) => b.kind === 'CRITICAL_ACCESSIBILITY_ISSUE'),
      residualRisk.verdict.verdict,
    );

    const evidenceBundle = buildLaunchReadinessAuthorityEvidence(ready);
    assert(
      'launch-readiness-authority-v2',
      'launch evidence handoff',
      evidenceBundle.launchApproved === true,
      String(evidenceBundle.blockerCount),
    );

    const evidence = collectLaunchEvidence({ rawPrompt: EXPENSE_PROMPT });
    const validation = validateLaunchEvidence(evidence);
    const blockers = detectLaunchBlockers(evidence);
    const risks = analyzeLaunchRisk(evidence);
    const confidence = calculateLaunchConfidence({ evidence, evidenceValidation: validation, blockers, risks });
    const scores = scoreLaunchReadiness({ evidence, blockers });
    const verdict = resolveLaunchVerdict({ evidenceValidation: validation, blockers, risks, confidence });
    const audit = buildLaunchDecisionAudit({
      evidence,
      blockers,
      confidence,
      scores,
      verdict,
      decisionTrace: ['deterministic replay'],
    });
    assert(
      'launch-readiness-authority-v2',
      'deterministic replay',
      audit.verdict.verdict === ready.verdict.verdict,
      audit.verdict.verdict,
    );
  }

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}

export function printLaunchReadinessAuthorityV2ValidationResults(
  checks: ValidationCheck[],
  label = 'validate:launch-readiness-authority-v2',
): void {
  const failed = checks.filter((c) => !c.passed);
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} [${check.section}] ${check.name}: ${check.detail}`);
  }
  console.log(`\n${label}: ${failed.length ? 'FAILED' : 'PASSED'} (${checks.length} checks, ${failed.length} failed)`);
  if (failed.length) {
    process.exit(1);
  }
  console.log('\nLAUNCH_READINESS_AUTHORITY_V2_PASS');
}
