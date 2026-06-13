/**
 * Orchestration Proof Authority — chain coherence orchestrator (V1).
 */

import { assessFounderTestAutomation, buildUpstreamChainConfidenceFromSimulationContext } from '../founder-test-automation/index.js';
import {
  getFounderSimulationScenarioByType,
  resetFounderSimulationEngineModuleForTests,
  simulateArchitectureChain,
  simulateBuildPlanChain,
  simulateIntakeChain,
  simulatePlanningChain,
} from '../founder-simulation-engine/index.js';
import type { FounderSimulationChainContext, FounderSimulationScenarioType } from '../founder-simulation-engine/founder-simulation-types.js';
import { buildChainDerivedSweepReport } from '../founder-simulation-engine/simulation-sweep-adapter.js';
import { analyzeConfidencePropagation, resetConfidencePropagationCountersForTests } from './confidence-propagation-analyzer.js';
import { analyzeEvidencePropagation, resetEvidencePropagationCountersForTests } from './evidence-propagation-analyzer.js';
import { analyzeIntegrationConsistency, resetIntegrationDriftCounterForTests } from './integration-consistency-analyzer.js';
import {
  buildRepairRecommendations,
  deriveFailingAuthorities,
  deriveStrongestAuthorities,
  detectOrchestrationFailures,
  resetOrchestrationFailureCounterForTests,
} from './orchestration-failure-detector.js';
import { recordOrchestrationProofAnalysis } from './orchestration-proof-history.js';
import {
  AUTHORITY_CHAIN_ORDER,
  CHAIN_PROOF_SCENARIO_TYPES,
  MAX_ORCHESTRATION_PROOF_RUNTIME_MS,
} from './orchestration-proof-registry.js';
import { analyzeReadinessPropagation, resetReadinessPropagationCountersForTests } from './readiness-propagation-analyzer.js';
import { analyzeRoleConsistency, resetRoleDriftCounterForTests } from './role-consistency-analyzer.js';
import {
  detectInformationLosses,
  extractAuthoritySnapshots,
} from './project-consistency-tracker.js';
import { analyzeWorkflowConsistency, resetWorkflowDriftCounterForTests } from './workflow-consistency-analyzer.js';
import type {
  AuthorityId,
  ChainConsistencyResult,
  DriftFinding,
  InformationLossItem,
  OrchestrationFailureItem,
  OrchestrationProofAnalysis,
  OrchestrationProofAssessment,
  OrchestrationProofCategory,
  OrchestrationProofRun,
  PropagationIssueItem,
  ProveOrchestrationInput,
  RunOrchestrationProofInput,
  SystemOrchestrationProof,
} from './orchestration-proof-types.js';

let proofCounter = 0;

export function resetOrchestrationProofCounterForTests(): void {
  proofCounter = 0;
}

export function resetOrchestrationProofModuleForTests(): void {
  resetOrchestrationProofCounterForTests();
  resetEvidencePropagationCountersForTests();
  resetWorkflowDriftCounterForTests();
  resetRoleDriftCounterForTests();
  resetIntegrationDriftCounterForTests();
  resetConfidencePropagationCountersForTests();
  resetReadinessPropagationCountersForTests();
  resetOrchestrationFailureCounterForTests();
}

function nextProofId(): string {
  proofCounter += 1;
  return `orchestration-proof-${proofCounter}`;
}

function mapProofCategory(score: number): OrchestrationProofCategory {
  if (score >= 90) return 'FULLY_PROVEN_CHAIN';
  if (score >= 70) return 'CONSISTENT_CHAIN';
  if (score >= 40) return 'PARTIAL_CHAIN';
  return 'BROKEN_CHAIN';
}

function computeProofScore(input: {
  informationLossCount: number;
  driftCount: number;
  failureCount: number;
  collapseDetected: boolean;
  inflationDetected: boolean;
  authoritiesReached: number;
}): number {
  let score = 100;
  score -= Math.min(40, input.informationLossCount * 10);
  score -= Math.min(30, input.driftCount * 6);
  score -= Math.min(25, input.failureCount * 5);
  if (input.collapseDetected) score -= 20;
  if (input.inflationDetected) score -= 25;
  if (input.authoritiesReached < 3) score -= 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildSystemProof(input: {
  snapshots: ReturnType<typeof extractAuthoritySnapshots>;
  informationLosses: InformationLossItem[];
  driftFindings: DriftFinding[];
  confidenceIssues: PropagationIssueItem[];
  readinessIssues: PropagationIssueItem[];
  inconsistentAuthorities: AuthorityId[];
}): SystemOrchestrationProof {
  const evaluated = AUTHORITY_CHAIN_ORDER.filter((id) =>
    input.snapshots.some((s) => s.authorityId === id),
  );
  const reached = [...new Set(input.snapshots.filter((s) => s.reached).map((s) => s.authorityId))];
  const inconsistent = [...new Set(input.inconsistentAuthorities)];
  const consistent = reached.filter((id) => !inconsistent.includes(id));

  return {
    readOnly: true,
    authoritiesEvaluated: evaluated,
    authoritiesConsistent: consistent,
    authoritiesInconsistent: input.inconsistentAuthorities,
    informationLosses: input.informationLosses,
    driftFindings: input.driftFindings,
    confidenceFindings: input.confidenceIssues,
    readinessFindings: input.readinessIssues,
  };
}

function buildChainConsistencyResult(input: {
  scenarioType: string;
  scenarioName: string;
  proofScore: number;
  snapshots: ReturnType<typeof extractAuthoritySnapshots>;
  informationLossCount: number;
  driftCount: number;
  failures: readonly OrchestrationFailureItem[];
}): ChainConsistencyResult {
  const failureByAuthority = new Map<AuthorityId, number>();
  for (const f of input.failures) {
    failureByAuthority.set(f.failingAuthority, (failureByAuthority.get(f.failingAuthority) ?? 0) + 1);
  }

  const ranked = input.snapshots
    .filter((s) => s.reached)
    .map((s) => ({ id: s.authorityId, failures: failureByAuthority.get(s.authorityId) ?? 0 }))
    .sort((a, b) => a.failures - b.failures);

  return {
    readOnly: true,
    scenarioType: input.scenarioType,
    scenarioName: input.scenarioName,
    proofScore: input.proofScore,
    proofCategory: mapProofCategory(input.proofScore),
    authoritiesReached: input.snapshots.filter((s) => s.reached).length,
    informationLossCount: input.informationLossCount,
    driftCount: input.driftCount,
    failureCount: input.failures.length,
    strongestAuthority: ranked[0]?.id ?? null,
    weakestAuthority: ranked[ranked.length - 1]?.id ?? null,
  };
}

function analyzeChain(input: ProveOrchestrationInput): OrchestrationProofAnalysis | null {
  const snapshots = extractAuthoritySnapshots(input);
  if (snapshots.length === 0) return null;

  const informationLosses = detectInformationLosses(snapshots);
  const evidencePropagation = analyzeEvidencePropagation(snapshots);
  const driftFindings = [
    ...analyzeWorkflowConsistency(snapshots),
    ...analyzeRoleConsistency(snapshots),
    ...analyzeIntegrationConsistency(snapshots),
  ];
  const confidencePropagation = analyzeConfidencePropagation(snapshots);
  const gateDecision = input.planningGateAnalysis?.planningGateDecision ?? null;
  const readinessPropagation = analyzeReadinessPropagation(snapshots, gateDecision);

  const orchestrationFailures = detectOrchestrationFailures({
    informationLosses,
    driftFindings,
    confidenceIssues: confidencePropagation.issues,
    readinessIssues: readinessPropagation.issues,
    evidenceIssues: evidencePropagation.issues,
  });

  const failingAuthorities = deriveFailingAuthorities(orchestrationFailures);
  const strongestAuthorities = deriveStrongestAuthorities({ snapshots, failures: orchestrationFailures });

  const proofScore = computeProofScore({
    informationLossCount: informationLosses.length,
    driftCount: driftFindings.length,
    failureCount: orchestrationFailures.length,
    collapseDetected: confidencePropagation.collapseDetected,
    inflationDetected: readinessPropagation.inflationDetected,
    authoritiesReached: snapshots.filter((s) => s.reached).length,
  });

  return {
    readOnly: true,
    proofId: nextProofId(),
    analyzedAt: new Date().toISOString(),
    orchestrationProofScore: proofScore,
    orchestrationProofCategory: mapProofCategory(proofScore),
    systemOrchestrationProof: buildSystemProof({
      snapshots,
      informationLosses,
      driftFindings,
      confidenceIssues: confidencePropagation.issues,
      readinessIssues: readinessPropagation.issues,
      inconsistentAuthorities: failingAuthorities,
    }),
    evidencePropagation,
    confidencePropagation,
    readinessPropagation,
    orchestrationFailures,
    chainConsistencyResults: [
      buildChainConsistencyResult({
        scenarioType: input.scenarioType ?? 'UNKNOWN',
        scenarioName: input.scenarioName ?? 'Unknown Scenario',
        proofScore,
        snapshots,
        informationLossCount: informationLosses.length,
        driftCount: driftFindings.length,
        failures: orchestrationFailures,
      }),
    ],
    authoritySnapshots: snapshots,
    repairRecommendations: buildRepairRecommendations(orchestrationFailures),
    strongestAuthorities,
    failingAuthorities,
  };
}

export function proveOrchestration(input: ProveOrchestrationInput): OrchestrationProofAnalysis | null {
  const analysis = analyzeChain(input);
  if (analysis && !input.skipHistoryRecording) {
    recordOrchestrationProofAnalysis(analysis);
  }
  return analysis;
}

export function runOrchestrationProofAuthority(input: ProveOrchestrationInput): OrchestrationProofAssessment {
  if (!input.unifiedIntakeAnalysis) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'ORCHESTRATION_PROOF_FAILED',
      analysis: null,
      failureReason: 'MISSING_UNIFIED_INTAKE',
    };
  }

  const analysis = proveOrchestration(input);
  if (!analysis) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'ORCHESTRATION_PROOF_FAILED',
      analysis: null,
      failureReason: 'PROOF_ANALYSIS_FAILED',
    };
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'ORCHESTRATION_PROOF_COMPLETE',
    analysis,
    failureReason: null,
  };
}

function buildChainContext(scenario: import('../founder-simulation-engine/founder-simulation-types.js').FounderSimulationScenario): FounderSimulationChainContext {
  const intake = simulateIntakeChain({ scenario, applyAlignmentRepair: true });
  let context = intake.context;
  const planning = simulatePlanningChain({ context });
  context = planning.context;
  const architecture = simulateArchitectureChain({ context });
  context = architecture.context;
  const buildPlan = simulateBuildPlanChain({ context });
  context = buildPlan.context;

  const stageResults = [
    ...intake.stages,
    ...planning.stages,
    ...architecture.stages,
    ...buildPlan.stages,
  ];
  const sweepReport = buildChainDerivedSweepReport({
    simulationId: `orch-proof-${scenario.scenarioId}`,
    context,
    stageResults,
  });
  const founderTest = assessFounderTestAutomation({
    founderTestRealitySweepReport: sweepReport,
    requirementCompletenessAnalysis: context.completenessAnalysis,
    visualReferenceAnalysis: context.visualAnalysis,
    voiceNotesAnalysis: context.voiceAnalysis,
    upstreamChainConfidence: buildUpstreamChainConfidenceFromSimulationContext(context),
    skipHistoryRecording: true,
  });

  return { ...context, founderTestAnalysis: founderTest.analysis };
}

function contextToProofInput(
  context: FounderSimulationChainContext,
  scenario: import('../founder-simulation-engine/founder-simulation-types.js').FounderSimulationScenario,
): ProveOrchestrationInput {
  return {
    scenarioType: scenario.scenarioType,
    scenarioName: scenario.scenarioName,
    unifiedIntakeAnalysis: context.unifiedIntakeAnalysis,
    planningGateAnalysis: context.planningGateAnalysis,
    planningBrief: context.planningBrief,
    architectureBrief: context.architectureBrief,
    buildPlan: context.buildPlan,
    founderTestAnalysis: context.founderTestAnalysis,
    skipHistoryRecording: true,
  };
}

export function runOrchestrationProof(input: RunOrchestrationProofInput = {}): OrchestrationProofRun {
  const startedAt = Date.now();
  const log = input.progressLogger ?? (() => undefined);
  const scenarioTypes = input.scenarioTypes ?? CHAIN_PROOF_SCENARIO_TYPES;

  resetFounderSimulationEngineModuleForTests();

  const chainResults: ChainConsistencyResult[] = [];
  const allSnapshots: ReturnType<typeof extractAuthoritySnapshots> = [];
  const allLosses: InformationLossItem[] = [];
  const allDrift: DriftFinding[] = [];
  const allFailures: OrchestrationFailureItem[] = [];
  let lastEvidence = analyzeEvidencePropagation([]);
  let lastConfidence = analyzeConfidencePropagation([]);
  let lastReadiness = analyzeReadinessPropagation([]);

  for (const scenarioType of scenarioTypes) {
    if (Date.now() - startedAt > MAX_ORCHESTRATION_PROOF_RUNTIME_MS) {
      log('Orchestration proof runtime budget exceeded');
      break;
    }

    const scenario = getFounderSimulationScenarioByType(scenarioType as FounderSimulationScenarioType);
    if (!scenario) continue;

    log(`Proving orchestration for ${scenario.scenarioName}`);
    const context = buildChainContext(scenario);
    const scenarioProof = analyzeChain(contextToProofInput(context, scenario));
    if (!scenarioProof) continue;

    chainResults.push(...scenarioProof.chainConsistencyResults);
    allSnapshots.push(...scenarioProof.authoritySnapshots);
    allLosses.push(...scenarioProof.systemOrchestrationProof.informationLosses);
    allDrift.push(...scenarioProof.systemOrchestrationProof.driftFindings);
    allFailures.push(...scenarioProof.orchestrationFailures);
    lastEvidence = scenarioProof.evidencePropagation;
    lastConfidence = scenarioProof.confidencePropagation;
    lastReadiness = scenarioProof.readinessPropagation;
  }

  if (chainResults.length === 0) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'ORCHESTRATION_PROOF_FAILED',
      analysis: null,
      failureReason: 'NO_SCENARIO_PROOFS',
    };
  }

  const aggregateScore = Math.round(
    chainResults.reduce((sum, r) => sum + r.proofScore, 0) / chainResults.length,
  );

  const failingAuthorities = deriveFailingAuthorities(allFailures);
  const strongestAuthorities = deriveStrongestAuthorities({ snapshots: allSnapshots, failures: allFailures });

  const analysis: OrchestrationProofAnalysis = {
    readOnly: true,
    proofId: nextProofId(),
    analyzedAt: new Date().toISOString(),
    orchestrationProofScore: aggregateScore,
    orchestrationProofCategory: mapProofCategory(aggregateScore),
    systemOrchestrationProof: buildSystemProof({
      snapshots: allSnapshots,
      informationLosses: allLosses,
      driftFindings: allDrift,
      confidenceIssues: lastConfidence.issues,
      readinessIssues: lastReadiness.issues,
      inconsistentAuthorities: failingAuthorities,
    }),
    evidencePropagation: lastEvidence,
    confidencePropagation: lastConfidence,
    readinessPropagation: lastReadiness,
    orchestrationFailures: allFailures,
    chainConsistencyResults: chainResults,
    authoritySnapshots: allSnapshots,
    repairRecommendations: buildRepairRecommendations(allFailures),
    strongestAuthorities,
    failingAuthorities,
  };

  if (!input.skipHistoryRecording) {
    recordOrchestrationProofAnalysis(analysis);
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'ORCHESTRATION_PROOF_COMPLETE',
    analysis,
    failureReason: null,
  };
}
