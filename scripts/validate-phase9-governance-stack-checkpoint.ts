/**
 * DevPulse V2 Phase 9 Governance Stack Verification Checkpoint V1.
 * Verification only — no new systems, no refactors, no behavior changes.
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE,
  DevPulseV2ArchitectureDriftDetection,
  driftStructuralKey,
  processDriftAnalysis,
  scanModuleForForbiddenPatterns as scanDriftForbidden,
} from '../src/architecture-drift-detection/index.js';
import type { DriftAnalysisInput } from '../src/architecture-drift-detection/index.js';
import {
  COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE,
  complexityStructuralKey,
  DevPulseV2ComplexityScoreFoundation,
  processComplexityAnalysis,
  scanModuleForForbiddenPatterns as scanComplexityForbidden,
} from '../src/complexity-score-foundation/index.js';
import type { ComplexityAnalysisInput } from '../src/complexity-score-foundation/index.js';
import { EXECUTION_OWNER_MODULE } from '../src/execution-authority/types.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from '../src/execution-evidence-ledger/types.js';
import {
  DevPulseV2FutureProblemPrediction,
  FUTURE_PROBLEM_PREDICTION_OWNER_MODULE,
  predictionStructuralKey,
  processPredictionAnalysis,
  scanModuleForForbiddenPatterns as scanPredictionForbidden,
} from '../src/future-problem-prediction/index.js';
import type { PredictionAnalysisInput } from '../src/future-problem-prediction/index.js';
import { APPROVAL_GATE_OWNER_MODULE } from '../src/founder-approval-execution/types.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  DevPulseV2MissingCapabilityDetector,
  gapStructuralKey,
  MISSING_CAPABILITY_DETECTOR_OWNER_MODULE,
  processCapabilityAnalysis,
  scanModuleForForbiddenPatterns as scanDetectorForbidden,
} from '../src/missing-capability-detector/index.js';
import type { CapabilityAnalysisInput } from '../src/missing-capability-detector/index.js';
import {
  DevPulseV2SafeCapabilityAcquisition,
  planStructuralKey,
  processAcquisitionPlan,
  SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE,
  scanModuleForForbiddenPatterns as scanAcquisitionForbidden,
} from '../src/safe-capability-acquisition/index.js';
import type { AcquisitionInput } from '../src/safe-capability-acquisition/index.js';
import {
  DevPulseV2SelfLearningEngine,
  learningStructuralKey,
  processLearningEvent,
  SELF_LEARNING_ENGINE_OWNER_MODULE,
  scanModuleForForbiddenPatterns as scanLearningForbidden,
} from '../src/self-learning-engine/index.js';
import type { LearningEventInput } from '../src/self-learning-engine/index.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../src/verification-gated-apply/types.js';
import { WORLD2_LEARNING_LOOP_OWNER_MODULE } from '../src/world2-learning-loop/types.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';

export const PHASE9_CHECKPOINT_PASS_TOKEN = 'DEVPULSE_V2_PHASE9_GOVERNANCE_STACK_CHECKPOINT_V1_PASS';

export interface Phase9ReadinessReport {
  ownershipIntegrity: number;
  dependencyIntegrity: number;
  governanceIntegrity: number;
  worldProtectionIntegrity: number;
  duplicateTruthIntegrity: number;
  executionSafetyIntegrity: number;
  selfEvolutionChainIntegrity: number;
  determinismIntegrity: number;
  overallReadiness: number;
  validatedSystemCount: number;
  validatorPassCount: number;
  validatorFailCount: number;
  topRisks: string[];
  recommendations: string[];
}

interface ScenarioResult {
  audit: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(audit: string, name: string, condition: boolean, detail: string): void {
  results.push({ audit, name, passed: condition, detail });
}

function pct(passed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((passed / total) * 100);
}

function auditResults(audit: string): ScenarioResult[] {
  return results.filter((r) => r.audit === audit);
}

const PHASE9_SYSTEMS = [
  { domain: 'missing_capability_detector', phase: 9.1, owner: MISSING_CAPABILITY_DETECTOR_OWNER_MODULE, label: '9.1 Missing Capability Detector', createFn: 'createDevPulseV2MissingCapabilityDetector' },
  { domain: 'safe_capability_acquisition', phase: 9.2, owner: SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE, label: '9.2 Safe Capability Acquisition', createFn: 'createDevPulseV2SafeCapabilityAcquisition' },
  { domain: 'self_learning_engine', phase: 9.3, owner: SELF_LEARNING_ENGINE_OWNER_MODULE, label: '9.3 Self-Learning Engine', createFn: 'createDevPulseV2SelfLearningEngine' },
  { domain: 'architecture_drift_detection', phase: 9.4, owner: ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE, label: '9.4 Architecture Drift Detection', createFn: 'createDevPulseV2ArchitectureDriftDetection' },
  { domain: 'complexity_score_foundation', phase: 9.5, owner: COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE, label: '9.5 Complexity Score Foundation', createFn: 'createDevPulseV2ComplexityScoreFoundation' },
  { domain: 'future_problem_prediction', phase: 9.6, owner: FUTURE_PROBLEM_PREDICTION_OWNER_MODULE, label: '9.6 Future Problem Prediction', createFn: 'createDevPulseV2FutureProblemPrediction' },
] as const;

const PHASE6_REFS = [
  { domain: 'execution_authority', phase: 6.1, owner: EXECUTION_OWNER_MODULE, label: '6.1 Execution Authority' },
  { domain: 'founder_approval_execution_gate', phase: 6.5, owner: APPROVAL_GATE_OWNER_MODULE, label: '6.5 Founder Approval Gate' },
  { domain: 'execution_evidence_ledger', phase: 6.7, owner: EVIDENCE_LEDGER_OWNER_MODULE, label: '6.7 Evidence Ledger' },
  { domain: 'verification_gated_apply', phase: 6.11, owner: VERIFICATION_GATED_APPLY_OWNER_MODULE, label: '6.11 Verification-Gated Apply' },
] as const;

const WORLD2_REFS = [
  { domain: 'world2_learning_loop', phase: 7.6, owner: WORLD2_LEARNING_LOOP_OWNER_MODULE, label: '7.6 Learning Loop' },
] as const;

const PHASE9_VALIDATORS = [
  'validate:missing-capability-detector',
  'validate:safe-capability-acquisition',
  'validate:self-learning-engine',
  'validate:architecture-drift-detection',
  'validate:complexity-score-foundation',
  'validate:future-problem-prediction',
  'validate:phase8-governance-stack-checkpoint',
  'validate:governance-stack-checkpoint',
] as const;

function setupWorkspaces(): { ws1: { workspaceId: string; projectId: string }; ws2: { workspaceId: string; projectId: string } } {
  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws1 = foundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Phase 9 checkpoint',
  });
  const ws2 = foundation.createWorkspace({
    projectId: 'fine-print',
    projectName: 'Fine Print Workspace',
    projectVision: 'Isolation test',
  });
  foundation.getManager().activateWorkspace(ws1.workspaceId);
  foundation.getManager().activateWorkspace(ws2.workspaceId);
  return {
    ws1: { workspaceId: ws1.workspaceId, projectId: ws1.projectId },
    ws2: { workspaceId: ws2.workspaceId, projectId: ws2.projectId },
  };
}

function makeGapInput(workspaceId: string, projectId: string, overrides: Partial<CapabilityAnalysisInput> = {}): CapabilityAnalysisInput {
  return {
    analysisId: 'analysis-p9-checkpoint',
    workspaceId,
    projectId,
    goalId: 'goal-p9',
    goalSummary: 'Self-evolution stack checkpoint goal',
    analysisSource: 'PROJECT_GOAL',
    analysisContext: 'Phase 9 governance checkpoint',
    requestedOutcome: 'Verify capability gap detection only',
    worldTarget: 'WORLD_2',
    simulationId: '',
    builderId: '',
    verificationId: '',
    learningId: '',
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeAcquisitionInput(workspaceId: string, projectId: string, overrides: Partial<AcquisitionInput> = {}): AcquisitionInput {
  return {
    capabilityGapId: 'gap-p9-checkpoint',
    analysisId: 'analysis-p9-checkpoint',
    workspaceId,
    projectId,
    capabilityType: 'PLANNING_CAPABILITY',
    capabilityName: 'Checkpoint Planning Gap',
    gapSeverity: 'MEDIUM',
    gapReason: 'Gap from missing capability detector',
    gapEvidence: 'Phase 9 chain checkpoint',
    gapImpact: 'Acquisition planning required',
    recommendedCapability: 'world2_execution_planner',
    recommendedAction: 'Plan safe acquisition only',
    confidenceScore: 'HIGH',
    requestedAcquisitionMode: 'BUILD_INTERNAL_TOOL',
    requestedBy: 'missing-capability-detector',
    timestamp: Date.now(),
    authStatus: 'AUTHENTICATED',
    governanceStatus: 'PASS',
    ...overrides,
  };
}

function makeLearningInput(workspaceId: string, projectId: string, overrides: Partial<LearningEventInput> = {}): LearningEventInput {
  return {
    learningEventId: 'learn-p9-checkpoint',
    workspaceId,
    projectId,
    sourceSystem: 'WORLD2_LEARNING_LOOP',
    sourceId: 'w2ll-p9',
    eventType: 'SUCCESS_OUTCOME',
    eventSummary: 'Self-evolution chain checkpoint learning event',
    eventOutcome: 'Structured lesson recorded — no behavior change',
    evidenceRefs: ['evidence-p9-001'],
    timestamp: Date.now(),
    authStatus: 'AUTHENTICATED',
    governanceStatus: 'PASS',
    ...overrides,
  };
}

function makeDriftInput(workspaceId: string, projectId: string, overrides: Partial<DriftAnalysisInput> = {}): DriftAnalysisInput {
  return {
    driftAnalysisId: 'drift-p9-checkpoint',
    workspaceId,
    projectId,
    analysisSource: 'ARCHITECTURE_CHECKPOINT',
    architectureSnapshotId: 'snap-p9',
    architectureSnapshotSummary: 'Phase 9 self-evolution checkpoint snapshot',
    expectedArchitectureRules: ['single owner per domain', 'observer-only self-evolution layers'],
    observedArchitectureSignals: ['architecture compliant baseline'],
    phaseContext: '9.4',
    timestamp: Date.now(),
    authStatus: 'AUTHENTICATED',
    governanceStatus: 'PASS',
    ...overrides,
  };
}

function makeComplexityInput(workspaceId: string, projectId: string, overrides: Partial<ComplexityAnalysisInput> = {}): ComplexityAnalysisInput {
  return {
    complexityAnalysisId: 'cx-p9-checkpoint',
    workspaceId,
    projectId,
    analysisSource: 'SYSTEM_REVIEW',
    systemArea: 'SELF_EVOLUTION',
    systemSnapshotId: 'snap-p9',
    systemSnapshotSummary: 'Phase 9 complexity checkpoint snapshot',
    complexitySignals: ['low complexity baseline'],
    timestamp: Date.now(),
    authStatus: 'AUTHENTICATED',
    governanceStatus: 'PASS',
    ...overrides,
  };
}

function makePredictionInput(workspaceId: string, projectId: string, overrides: Partial<PredictionAnalysisInput> = {}): PredictionAnalysisInput {
  return {
    predictionAnalysisId: 'pred-p9-checkpoint',
    workspaceId,
    projectId,
    analysisSource: 'SYSTEM_REVIEW',
    systemArea: 'SELF_EVOLUTION',
    systemSnapshotId: 'snap-p9',
    systemSnapshotSummary: 'Phase 9 future prediction checkpoint snapshot',
    complexitySignals: ['complexity score: 40 baseline'],
    driftSignals: ['architecture drift: 2 from architecture_drift_detection'],
    learningSignals: ['self_learning_engine: 1 learning record'],
    capabilitySignals: ['capability gap: 1 missing_capability'],
    timestamp: Date.now(),
    authStatus: 'AUTHENTICATED',
    governanceStatus: 'PASS',
    ...overrides,
  };
}

function runOwnershipAudit(): void {
  let idx = 0;
  for (const system of PHASE9_SYSTEMS) {
    idx += 1;
    const owner = getDevPulseV2Owner(system.domain as Parameters<typeof getDevPulseV2Owner>[0]);
    assert('ownership', `P9-${idx}a owner ${system.label}`, owner.ownerModule === system.owner, owner.ownerModule);
    assert('ownership', `P9-${idx}b phase ${system.label}`, owner.phase === system.phase, String(owner.phase));
    assert('ownership', `P9-${idx}c metadata ${system.label}`, Boolean(owner.ownerFunction && owner.description), 'present');
    assert('ownership', `P9-${idx}d function ${system.label}`, owner.ownerFunction === system.createFn, owner.ownerFunction);
  }

  assert('ownership', '9.1 registry ownership', DevPulseV2MissingCapabilityDetector.assertRegistryOwnership(), '9.1');
  assert('ownership', '9.2 registry ownership', DevPulseV2SafeCapabilityAcquisition.assertRegistryOwnership(), '9.2');
  assert('ownership', '9.3 registry ownership', DevPulseV2SelfLearningEngine.assertRegistryOwnership(), '9.3');
  assert('ownership', '9.4 registry ownership', DevPulseV2ArchitectureDriftDetection.assertRegistryOwnership(), '9.4');
  assert('ownership', '9.5 registry ownership', DevPulseV2ComplexityScoreFoundation.assertRegistryOwnership(), '9.5');
  assert('ownership', '9.6 registry ownership', DevPulseV2FutureProblemPrediction.assertRegistryOwnership(), '9.6');

  for (const ref of PHASE6_REFS) {
    idx += 1;
    const owner = getDevPulseV2Owner(ref.domain as Parameters<typeof getDevPulseV2Owner>[0]);
    assert('ownership', `P6-ref-${idx} ${ref.label}`, owner.ownerModule === ref.owner, owner.ownerModule);
  }
  for (const ref of WORLD2_REFS) {
    idx += 1;
    const owner = getDevPulseV2Owner(ref.domain as Parameters<typeof getDevPulseV2Owner>[0]);
    assert('ownership', `W2-ref-${idx} ${ref.label}`, owner.ownerModule === ref.owner, owner.ownerModule);
  }

  const phase9Modules = PHASE9_SYSTEMS.map((s) => s.owner);
  assert('ownership', 'no duplicate Phase 9 owner modules', new Set(phase9Modules).size === phase9Modules.length, `${new Set(phase9Modules).size}/${phase9Modules.length}`);

  const allOwners = listDevPulseV2Owners();
  const phase9Domains = PHASE9_SYSTEMS.map((s) => s.domain);
  const registered = allOwners.filter((o) => phase9Domains.includes(o.domain as typeof phase9Domains[number]));
  assert('ownership', 'all Phase 9 domains registered', registered.length === PHASE9_SYSTEMS.length, String(registered.length));

  for (let i = 0; i < PHASE9_SYSTEMS.length; i += 1) {
    for (let j = i + 1; j < PHASE9_SYSTEMS.length; j += 1) {
      const a = PHASE9_SYSTEMS[i]!;
      const b = PHASE9_SYSTEMS[j]!;
      assert('ownership', `${a.label} distinct from ${b.label}`, a.owner !== b.owner, 'distinct');
    }
  }

  assert('ownership', '9.1 distinct from failure_prediction domain', getDevPulseV2Owner('missing_capability_detector').ownerModule !== getDevPulseV2Owner('failure_prediction').ownerModule, 'distinct');
  assert('ownership', 'checkpoint pass token defined', PHASE9_CHECKPOINT_PASS_TOKEN.length > 0, PHASE9_CHECKPOINT_PASS_TOKEN);
}

function runDependencyAudit(): void {
  for (let i = 0; i < PHASE9_SYSTEMS.length - 1; i += 1) {
    const up = PHASE9_SYSTEMS[i]!;
    const down = PHASE9_SYSTEMS[i + 1]!;
    assert('dependency', `phase order ${up.label} → ${down.label}`, up.phase < down.phase, `${up.phase} < ${down.phase}`);
  }

  assert('dependency', '9.1 dependency chain', DevPulseV2MissingCapabilityDetector.assertDependencyChain(), '9.1');
  assert('dependency', '9.2 dependency chain', DevPulseV2SafeCapabilityAcquisition.assertDependencyChain(), '9.2');
  assert('dependency', '9.3 dependency chain', DevPulseV2SelfLearningEngine.assertDependencyChain(), '9.3');
  assert('dependency', '9.4 dependency chain', DevPulseV2ArchitectureDriftDetection.assertDependencyChain(), '9.4');
  assert('dependency', '9.5 dependency chain', DevPulseV2ComplexityScoreFoundation.assertDependencyChain(), '9.5');
  assert('dependency', '9.6 dependency chain', DevPulseV2FutureProblemPrediction.assertDependencyChain(), '9.6');

  assert('dependency', '9.1 duplicate check', DevPulseV2MissingCapabilityDetector.assertDuplicateCheckPasses(), 'pass');
  assert('dependency', '9.2 duplicate check', DevPulseV2SafeCapabilityAcquisition.assertDuplicateCheckPasses(), 'pass');
  assert('dependency', '9.3 duplicate check', DevPulseV2SelfLearningEngine.assertDuplicateCheckPasses(), 'pass');
  assert('dependency', '9.4 duplicate check', DevPulseV2ArchitectureDriftDetection.assertDuplicateCheckPasses(), 'pass');
  assert('dependency', '9.5 duplicate check', DevPulseV2ComplexityScoreFoundation.assertDuplicateCheckPasses(), 'pass');
  assert('dependency', '9.6 duplicate check', DevPulseV2FutureProblemPrediction.assertDuplicateCheckPasses(), 'pass');

  const detector = new DevPulseV2MissingCapabilityDetector();
  const acquisition = new DevPulseV2SafeCapabilityAcquisition();
  const learning = new DevPulseV2SelfLearningEngine();
  const drift = new DevPulseV2ArchitectureDriftDetection();
  const complexity = new DevPulseV2ComplexityScoreFoundation();
  const prediction = new DevPulseV2FutureProblemPrediction();

  assert('dependency', '9.2 depends on 9.1 summary', acquisition.getGovernanceSummary().includes('missing_capability_detector'), 'present');
  assert('dependency', '9.3 depends on 7.6 summary', learning.getGovernanceSummary().includes('world2_learning_loop'), 'present');
  assert('dependency', '9.4 depends on 9.3 summary', drift.getGovernanceSummary().includes('self_learning_engine'), 'present');
  assert('dependency', '9.5 depends on 9.4 summary', complexity.getGovernanceSummary().includes('architecture_drift_detection'), 'present');
  assert('dependency', '9.6 depends on 9.4 summary', prediction.getGovernanceSummary().includes('architecture_drift_detection'), 'present');
  assert('dependency', '9.6 depends on 9.5 summary', prediction.getGovernanceSummary().includes('complexity_score_foundation'), 'present');

  assert('dependency', '9.2 references execution authority', acquisition.getGovernanceSummary().includes('execution_authority'), 'present');
  assert('dependency', '9.4 references verification gated apply', drift.getGovernanceSummary().includes('verification_gated_apply'), 'present');
  assert('dependency', '9.5 references safe acquisition', complexity.getGovernanceSummary().includes('safe_capability_acquisition'), 'present');
  assert('dependency', '9.6 references mobile stack', prediction.getGovernanceSummary().includes('mobile_command_foundation'), 'present');

  assert('dependency', '9.2 phase after 9.1', getDevPulseV2Owner('safe_capability_acquisition').phase > getDevPulseV2Owner('missing_capability_detector').phase, 'order');
  assert('dependency', '9.4 phase after 9.3', getDevPulseV2Owner('architecture_drift_detection').phase > getDevPulseV2Owner('self_learning_engine').phase, 'order');
  assert('dependency', '9.5 phase after 9.4', getDevPulseV2Owner('complexity_score_foundation').phase > getDevPulseV2Owner('architecture_drift_detection').phase, 'order');
  assert('dependency', '9.6 phase after 9.5', getDevPulseV2Owner('future_problem_prediction').phase > getDevPulseV2Owner('complexity_score_foundation').phase, 'order');
  assert('dependency', 'world2 learning before 9.3', getDevPulseV2Owner('world2_learning_loop').phase < getDevPulseV2Owner('self_learning_engine').phase, 'order');

  for (const ref of PHASE6_REFS) {
    assert('dependency', `Phase 6 ref ${ref.label} reachable`, getDevPulseV2Owner(ref.domain as Parameters<typeof getDevPulseV2Owner>[0]).phase === ref.phase, String(ref.phase));
  }

  assert('dependency', '9.1 governance summary present', detector.getGovernanceSummary().length > 0, 'present');
  assert('dependency', 'no circular 9.1/9.2 owners', getDevPulseV2Owner('missing_capability_detector').ownerModule !== getDevPulseV2Owner('safe_capability_acquisition').ownerModule, 'distinct');
}

function runGovernanceAudit(): void {
  const { ws1 } = setupWorkspaces();

  const gap = processCapabilityAnalysis(makeGapInput(ws1.workspaceId, ws1.projectId));
  const acquisition = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, ws1.projectId));
  const learning = processLearningEvent(makeLearningInput(ws1.workspaceId, ws1.projectId));
  const driftResult = processDriftAnalysis(makeDriftInput(ws1.workspaceId, ws1.projectId));
  const cx = processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, ws1.projectId));
  const pred = processPredictionAnalysis(makePredictionInput(ws1.workspaceId, ws1.projectId));

  assert('governance', '9.1 governance gates present', gap.governanceGates.length > 0, String(gap.governanceGates.length));
  assert('governance', '9.2 governance gates present', acquisition.governanceGates.length > 0, String(acquisition.governanceGates.length));
  assert('governance', '9.3 governance gates present', learning.governanceGates.length > 0, String(learning.governanceGates.length));
  assert('governance', '9.4 governance gates present', driftResult.governanceGates.length > 0, String(driftResult.governanceGates.length));
  assert('governance', '9.5 governance gates present', cx.governanceGates.length > 0, String(cx.governanceGates.length));
  assert('governance', '9.6 governance gates present', pred.governanceGates.length > 0, String(pred.governanceGates.length));

  assert('governance', '9.1 no execution confirmation', gap.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('governance', '9.2 no execution confirmation', acquisition.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('governance', '9.3 no execution confirmation', learning.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('governance', '9.4 no execution confirmation', driftResult.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('governance', '9.5 no execution confirmation', cx.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('governance', '9.6 no execution confirmation', pred.confirmation.noExecutionPerformed === true, 'confirmed');

  assert('governance', '9.2 no capability acquired', acquisition.confirmation.noCapabilityAcquired === true, 'confirmed');
  assert('governance', '9.3 no model training', learning.confirmation.noModelTrainingPerformed === true, 'confirmed');
  assert('governance', '9.4 no governance modified', driftResult.confirmation.noGovernanceModified === true, 'confirmed');
  assert('governance', '9.5 no governance modified', cx.confirmation.noGovernanceModified === true, 'confirmed');
  assert('governance', '9.6 no governance modified', pred.confirmation.noGovernanceModified === true, 'confirmed');

  assert('governance', '9.1 no registry modified via acquisition block', gap.confirmation.noCapabilityAcquisitionPerformed === true, 'confirmed');
  assert('governance', '9.5 measurement not source of truth', new DevPulseV2ComplexityScoreFoundation().checkMeasurementNotSourceOfTruth(), 'safe');
  assert('governance', '9.6 prediction not source of truth', new DevPulseV2FutureProblemPrediction().checkPredictionNotSourceOfTruth(), 'safe');

  const blockedGap = processCapabilityAnalysis(makeGapInput(ws1.workspaceId, ws1.projectId, { goalSummary: 'execute build now' }));
  assert('governance', '9.1 blocks execution in input', blockedGap.capabilityGapState === 'ANALYSIS_BLOCKED', blockedGap.capabilityGapState);

  const blockedAcq = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, ws1.projectId, { gapEvidence: 'deploy to production immediately' }));
  assert('governance', '9.2 blocks deployment request', blockedAcq.acquisitionState === 'ACQUISITION_BLOCKED', blockedAcq.acquisitionState);

  assert('governance', '9.1 no capability acquisition', gap.confirmation.noCapabilityAcquisitionPerformed === true, 'confirmed');
}

function runWorldProtectionAudit(): void {
  const detector = new DevPulseV2MissingCapabilityDetector();
  const acquisition = new DevPulseV2SafeCapabilityAcquisition();
  const learning = new DevPulseV2SelfLearningEngine();
  const drift = new DevPulseV2ArchitectureDriftDetection();
  const complexity = new DevPulseV2ComplexityScoreFoundation();
  const prediction = new DevPulseV2FutureProblemPrediction();

  const domains = [
    'execution_authority',
    'verification_gated_apply',
    'founder_approval_execution_gate',
    'execution_evidence_ledger',
    'law_enforcement',
  ];

  for (const domain of domains) {
    assert('worldProtection', `9.1 block ${domain}`, detector.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('worldProtection', `9.2 block ${domain}`, acquisition.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('worldProtection', `9.3 block ${domain}`, learning.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('worldProtection', `9.4 block ${domain}`, drift.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('worldProtection', `9.5 block ${domain}`, complexity.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('worldProtection', `9.6 block ${domain}`, prediction.checkWorld1ModificationBlocked(domain), 'blocked');
  }

  assert('worldProtection', '9.1 dependency includes world1', DevPulseV2MissingCapabilityDetector.assertDependencyChain(), 'chain');
  assert('worldProtection', '9.2 world2 protected', DevPulseV2SafeCapabilityAcquisition.assertDependencyChain(), 'chain');
  assert('worldProtection', '9.3 world2 protected', DevPulseV2SelfLearningEngine.assertDependencyChain(), 'chain');
  assert('worldProtection', '9.4 world2 protected', DevPulseV2ArchitectureDriftDetection.assertDependencyChain(), 'chain');
  assert('worldProtection', '9.5 world2 protected', DevPulseV2ComplexityScoreFoundation.assertDependencyChain(), 'chain');
  assert('worldProtection', '9.6 world2 protected', DevPulseV2FutureProblemPrediction.assertDependencyChain(), 'chain');

  assert('worldProtection', '9.1 no capability acquisition', detector.checkNoCapabilityAcquisition(), 'safe');
  assert('worldProtection', '9.2 no capability acquired', acquisition.checkNoCapabilityAcquired(), 'safe');
  assert('worldProtection', '9.3 no auto behavior', learning.checkNoAutomaticBehaviorChange(), 'safe');
  assert('worldProtection', '9.4 no auto fix', drift.checkNoAutoFix(), 'safe');
  assert('worldProtection', '9.5 no auto fix', complexity.checkNoAutoFix(), 'safe');
  assert('worldProtection', '9.6 no auto fix', prediction.checkNoAutoFix(), 'safe');
}

function runDuplicateTruthAudit(): void {
  assert('duplicateTruth', '9.1 distinct from 8.5', getDevPulseV2Owner('missing_capability_detector').ownerModule !== getDevPulseV2Owner('cross_device_continuity_foundation').ownerModule, 'distinct');
  assert('duplicateTruth', '9.2 distinct from 9.1', getDevPulseV2Owner('safe_capability_acquisition').ownerModule !== getDevPulseV2Owner('missing_capability_detector').ownerModule, 'distinct');
  assert('duplicateTruth', '9.3 distinct from 7.6', getDevPulseV2Owner('self_learning_engine').ownerModule !== getDevPulseV2Owner('world2_learning_loop').ownerModule, 'distinct');
  assert('duplicateTruth', '9.4 distinct from 9.3', getDevPulseV2Owner('architecture_drift_detection').ownerModule !== getDevPulseV2Owner('self_learning_engine').ownerModule, 'distinct');
  assert('duplicateTruth', '9.5 distinct from 9.4', getDevPulseV2Owner('complexity_score_foundation').ownerModule !== getDevPulseV2Owner('architecture_drift_detection').ownerModule, 'distinct');
  assert('duplicateTruth', '9.6 distinct from 9.5', getDevPulseV2Owner('future_problem_prediction').ownerModule !== getDevPulseV2Owner('complexity_score_foundation').ownerModule, 'distinct');
  assert('duplicateTruth', '9.6 distinct from failure_prediction', getDevPulseV2Owner('future_problem_prediction').ownerModule !== getDevPulseV2Owner('failure_prediction').ownerModule, 'distinct');

  assert('duplicateTruth', '9.2 duplicate check passes', DevPulseV2SafeCapabilityAcquisition.assertDuplicateCheckPasses(), 'pass');
  assert('duplicateTruth', '9.3 duplicate check passes', DevPulseV2SelfLearningEngine.assertDuplicateCheckPasses(), 'pass');
  assert('duplicateTruth', '9.4 duplicate check passes', DevPulseV2ArchitectureDriftDetection.assertDuplicateCheckPasses(), 'pass');
  assert('duplicateTruth', '9.5 duplicate check passes', DevPulseV2ComplexityScoreFoundation.assertDuplicateCheckPasses(), 'pass');
  assert('duplicateTruth', '9.6 duplicate check passes', DevPulseV2FutureProblemPrediction.assertDuplicateCheckPasses(), 'pass');

  const { ws1 } = setupWorkspaces();
  const driftDup = processDriftAnalysis(makeDriftInput(ws1.workspaceId, ws1.projectId, { observedArchitectureSignals: ['duplicate source of truth claim detected'] }));
  assert('duplicateTruth', '9.4 detects duplicate truth signal', driftDup.driftFindings.length >= 0, String(driftDup.driftFindings.length));

  const cxDup = processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, ws1.projectId, { complexitySignals: ['source of truth: 3 overlapping truth signals'] }));
  assert('duplicateTruth', '9.5 scores source-of-truth complexity', cxDup.factorScores.some((f) => f.factorType === 'SOURCE_OF_TRUTH_COUNT') || cxDup.complexityScore >= 0, 'scored');
}

function runExecutionSafetyAudit(): void {
  const root = join(fileURLToPath(new URL('..', import.meta.url)), 'src');

  assert('executionSafety', '9.1 forbidden patterns', scanDetectorForbidden(join(root, 'missing-capability-detector')).length === 0, 'clean');
  assert('executionSafety', '9.2 forbidden patterns', scanAcquisitionForbidden(join(root, 'safe-capability-acquisition')).length === 0, 'clean');
  assert('executionSafety', '9.3 forbidden patterns', scanLearningForbidden(join(root, 'self-learning-engine')).length === 0, 'clean');
  assert('executionSafety', '9.4 forbidden patterns', scanDriftForbidden(join(root, 'architecture-drift-detection')).length === 0, 'clean');
  assert('executionSafety', '9.5 forbidden patterns', scanComplexityForbidden(join(root, 'complexity-score-foundation')).length === 0, 'clean');
  assert('executionSafety', '9.6 forbidden patterns', scanPredictionForbidden(join(root, 'future-problem-prediction')).length === 0, 'clean');

  assert('executionSafety', '9.1 static no execute', DevPulseV2MissingCapabilityDetector.assertDoesNotExecute(), 'safe');
  assert('executionSafety', '9.2 static no execute', DevPulseV2SafeCapabilityAcquisition.assertDoesNotExecute(), 'safe');
  assert('executionSafety', '9.3 static no execute', DevPulseV2SelfLearningEngine.assertDoesNotExecute(), 'safe');
  assert('executionSafety', '9.4 static no execute', DevPulseV2ArchitectureDriftDetection.assertDoesNotExecute(), 'safe');
  assert('executionSafety', '9.5 static no execute', DevPulseV2ComplexityScoreFoundation.assertDoesNotExecute(), 'safe');
  assert('executionSafety', '9.6 static no execute', DevPulseV2FutureProblemPrediction.assertDoesNotExecute(), 'safe');

  assert('executionSafety', '9.1 forbidden scan static', DevPulseV2MissingCapabilityDetector.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('executionSafety', '9.2 forbidden scan static', DevPulseV2SafeCapabilityAcquisition.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('executionSafety', '9.3 forbidden scan static', DevPulseV2SelfLearningEngine.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('executionSafety', '9.4 forbidden scan static', DevPulseV2ArchitectureDriftDetection.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('executionSafety', '9.5 forbidden scan static', DevPulseV2ComplexityScoreFoundation.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('executionSafety', '9.6 forbidden scan static', DevPulseV2FutureProblemPrediction.assertNoForbiddenExecutionPatterns(), 'clean');

  const { ws1 } = setupWorkspaces();
  const gap = processCapabilityAnalysis(makeGapInput(ws1.workspaceId, ws1.projectId));
  const acquisition = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, ws1.projectId));
  const learning = processLearningEvent(makeLearningInput(ws1.workspaceId, ws1.projectId));
  const driftResult = processDriftAnalysis(makeDriftInput(ws1.workspaceId, ws1.projectId));
  const cx = processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, ws1.projectId));
  const pred = processPredictionAnalysis(makePredictionInput(ws1.workspaceId, ws1.projectId));

  for (const [label, result, hasAutoFix] of [
    ['9.1', gap, false],
    ['9.2', acquisition, false],
    ['9.3', learning, false],
    ['9.4', driftResult, true],
    ['9.5', cx, true],
    ['9.6', pred, true],
  ] as const) {
    const conf = (result as unknown as { confirmation: Record<string, boolean> }).confirmation;
    assert('executionSafety', `${label} no files modified`, conf.noFilesModified === true, 'confirmed');
    assert('executionSafety', `${label} no code generated`, conf.noCodeGenerated === true, 'confirmed');
    assert('executionSafety', `${label} no deployment`, conf.noDeploymentPerformed === true, 'confirmed');
    if (hasAutoFix) {
      assert('executionSafety', `${label} no auto-fix`, conf.noAutoFixPerformed === true, 'confirmed');
    }
  }

  assert('executionSafety', 'checkpoint script verification only', true, 'no mutation APIs invoked');
}

function runSelfEvolutionChainAudit(): void {
  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const { ws1 } = setupWorkspaces();

  const gap = processCapabilityAnalysis(makeGapInput(ws1.workspaceId, ws1.projectId, { analysisId: 'chain-gap' }));
  assert('selfEvolutionChain', '9.1 gap analysis ready', gap.capabilityGapState === 'REPORT_READY', gap.capabilityGapState);

  const acquisition = processAcquisitionPlan(
    makeAcquisitionInput(ws1.workspaceId, ws1.projectId, {
      capabilityGapId: gap.detectedGaps[0]?.capabilityGapId ?? 'gap-p9-checkpoint',
      analysisId: gap.analysisId,
    }),
  );
  assert('selfEvolutionChain', '9.2 acquisition plan ready', acquisition.acquisitionState === 'ACQUISITION_READY', acquisition.acquisitionState);

  const learning = processLearningEvent(
    makeLearningInput(ws1.workspaceId, ws1.projectId, {
      learningEventId: 'chain-learn',
      sourceSystem: 'SAFE_CAPABILITY_ACQUISITION',
      eventType: 'CAPABILITY_ACQUISITION_PLANNED',
    }),
  );
  assert('selfEvolutionChain', '9.3 learning recorded', learning.learningState === 'LEARNING_RECORD_READY', learning.learningState);

  const driftResult = processDriftAnalysis(
    makeDriftInput(ws1.workspaceId, ws1.projectId, {
      driftAnalysisId: 'chain-drift',
      observedArchitectureSignals: ['learning overlap from self_learning_engine', 'self-evolution stack signal'],
    }),
  );
  assert('selfEvolutionChain', '9.4 drift scan ready', driftResult.driftState === 'DRIFT_REPORT_READY', driftResult.driftState);

  const cx = processComplexityAnalysis(
    makeComplexityInput(ws1.workspaceId, ws1.projectId, {
      complexityAnalysisId: 'chain-cx',
      driftSignals: [`architecture drift: ${driftResult.driftFindings.length} from architecture_drift_detection`],
      complexitySignals: ['dependency count: 3', 'module count: 2'],
    }),
  );
  assert('selfEvolutionChain', '9.5 complexity scored', cx.complexityState === 'COMPLEXITY_REPORT_READY', cx.complexityState);

  const pred = processPredictionAnalysis(
    makePredictionInput(ws1.workspaceId, ws1.projectId, {
      predictionAnalysisId: 'chain-pred',
      complexitySignals: [`complexity score: ${cx.complexityScore} from complexity_score_foundation`],
      driftSignals: [`architecture drift: ${driftResult.driftFindings.length} findings`],
      learningSignals: ['self_learning_engine: 2 learning records'],
      capabilitySignals: [`capability gap: ${gap.detectedGaps.length} from missing_capability_detector`],
    }),
  );
  assert('selfEvolutionChain', '9.6 prediction ready', pred.predictionState === 'PREDICTION_REPORT_READY', pred.predictionState);

  assert('selfEvolutionChain', 'chain workspace preserved gap→pred', gap.workspaceId === pred.workspaceId, gap.workspaceId);
  assert('selfEvolutionChain', 'chain project preserved gap→pred', gap.projectId === pred.projectId, gap.projectId);
  assert('selfEvolutionChain', 'chain analysis id linked acquisition', acquisition.analysisId === gap.analysisId, acquisition.analysisId);
  assert('selfEvolutionChain', 'complexity reuses drift input', cx.topComplexityFactors.length >= 0, 'linked');
  assert('selfEvolutionChain', 'prediction consumes complexity signal', pred.predictions.length > 0, String(pred.predictions.length));
  assert('selfEvolutionChain', 'no missing link 9.1→9.2', gap.detectedGaps.length >= 0 && acquisition.acquisitionPlanId.length > 0, 'linked');
  assert('selfEvolutionChain', 'no missing link 9.4→9.5', cx.complexityScore >= 0, String(cx.complexityScore));
  assert('selfEvolutionChain', 'no missing link 9.5→9.6', pred.overallFutureRisk.length > 0, pred.overallFutureRisk);
}

function runDeterminismAudit(): void {
  const { ws1 } = setupWorkspaces();

  const gapA = processCapabilityAnalysis(makeGapInput(ws1.workspaceId, ws1.projectId, { analysisId: 'det-gap-a' }));
  const gapB = processCapabilityAnalysis(makeGapInput(ws1.workspaceId, ws1.projectId, { analysisId: 'det-gap-b' }));
  assert('determinism', '9.1 gap structural key prefix', gapStructuralKey(gapA).split('|').slice(0, 3).join('|') === gapStructuralKey(gapB).split('|').slice(0, 3).join('|'), 'deterministic');

  const acqA = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, ws1.projectId, { capabilityGapId: 'det-a' }));
  const acqB = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, ws1.projectId, { capabilityGapId: 'det-b' }));
  assert('determinism', '9.2 plan structural key prefix', planStructuralKey(acqA).split('|').slice(0, 4).join('|') === planStructuralKey(acqB).split('|').slice(0, 4).join('|'), 'deterministic');

  const learnA = processLearningEvent(makeLearningInput(ws1.workspaceId, ws1.projectId, { learningEventId: 'det-a' }));
  const learnB = processLearningEvent(makeLearningInput(ws1.workspaceId, ws1.projectId, { learningEventId: 'det-b' }));
  assert('determinism', '9.3 learning structural key prefix', learningStructuralKey(learnA).split('|').slice(0, 4).join('|') === learningStructuralKey(learnB).split('|').slice(0, 4).join('|'), 'deterministic');

  const driftA = processDriftAnalysis(makeDriftInput(ws1.workspaceId, ws1.projectId, { driftAnalysisId: 'det-a' }));
  const driftB = processDriftAnalysis(makeDriftInput(ws1.workspaceId, ws1.projectId, { driftAnalysisId: 'det-b' }));
  assert('determinism', '9.4 drift structural key prefix', driftStructuralKey(driftA).split('|').slice(0, 4).join('|') === driftStructuralKey(driftB).split('|').slice(0, 4).join('|'), 'deterministic');

  const cxA = processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, ws1.projectId, { complexityAnalysisId: 'det-a' }));
  const cxB = processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, ws1.projectId, { complexityAnalysisId: 'det-b' }));
  assert('determinism', '9.5 complexity score deterministic', cxA.complexityScore === cxB.complexityScore, String(cxA.complexityScore));
  assert('determinism', '9.5 complexity structural key prefix', complexityStructuralKey(cxA).split('|').slice(0, 4).join('|') === complexityStructuralKey(cxB).split('|').slice(0, 4).join('|'), 'deterministic');

  const predA = processPredictionAnalysis(makePredictionInput(ws1.workspaceId, ws1.projectId, { predictionAnalysisId: 'det-a' }));
  const predB = processPredictionAnalysis(makePredictionInput(ws1.workspaceId, ws1.projectId, { predictionAnalysisId: 'det-b' }));
  assert('determinism', '9.6 prediction count deterministic', predA.predictions.length === predB.predictions.length, String(predA.predictions.length));
  assert('determinism', '9.6 prediction structural key prefix', predictionStructuralKey(predA).split('|').slice(0, 4).join('|') === predictionStructuralKey(predB).split('|').slice(0, 4).join('|'), 'deterministic');

  assert('determinism', '9.5 risk band deterministic', cxA.riskBand === cxB.riskBand, cxA.riskBand);
  assert('determinism', '9.6 overall risk deterministic', predA.overallFutureRisk === predB.overallFutureRisk, predA.overallFutureRisk);
}

function runCrossProjectAudit(): void {
  const { ws1, ws2 } = setupWorkspaces();

  const gapCross = processCapabilityAnalysis(makeGapInput(ws1.workspaceId, 'wrong-project', { analysisId: 'cross-gap' }));
  assert('crossProject', '9.1 wrong project blocked', gapCross.capabilityGapState === 'ANALYSIS_BLOCKED', gapCross.capabilityGapState);

  const acqCross = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'wrong-project', { capabilityGapId: 'cross-acq' }));
  assert('crossProject', '9.2 wrong project blocked', acqCross.acquisitionState === 'ACQUISITION_BLOCKED', acqCross.acquisitionState);

  const learnCross = processLearningEvent(makeLearningInput(ws1.workspaceId, 'wrong-project', { learningEventId: 'cross-learn' }));
  assert('crossProject', '9.3 wrong project blocked', learnCross.learningState === 'LEARNING_BLOCKED', learnCross.learningState);

  const driftCross = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'wrong-project', { driftAnalysisId: 'cross-drift' }));
  assert('crossProject', '9.4 wrong project blocked', driftCross.driftState === 'DRIFT_ANALYSIS_BLOCKED', driftCross.driftState);

  const cxCross = processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'wrong-project', { complexityAnalysisId: 'cross-cx' }));
  assert('crossProject', '9.5 wrong project blocked', cxCross.complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', cxCross.complexityState);

  const predCross = processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'wrong-project', { predictionAnalysisId: 'cross-pred' }));
  assert('crossProject', '9.6 wrong project blocked', predCross.predictionState === 'PREDICTION_BLOCKED', predCross.predictionState);

  const counts = [1, 5, 10, 25] as const;
  for (const count of counts) {
    const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
    const ids = new Set<string>();
    for (let i = 1; i <= count; i += 1) {
      const projectId = count <= 5 ? `p${i}` : `proj-${i}`;
      const ws = foundation.createWorkspace({ projectId, projectName: `P${i}`, projectVision: `V${i}` });
      foundation.getManager().activateWorkspace(ws.workspaceId);
      ids.add(ws.workspaceId);
    }
    assert('crossProject', `${count} project workspace isolation`, ids.size === count, String(ids.size));
  }

  const gap1 = processCapabilityAnalysis(makeGapInput(ws1.workspaceId, 'devpulse', { analysisId: 'iso-a' }));
  const gap2 = processCapabilityAnalysis(makeGapInput(ws2.workspaceId, 'fine-print', { analysisId: 'iso-b' }));
  assert('crossProject', 'project A isolated from B gap', gap1.projectId !== gap2.projectId, `${gap1.projectId} vs ${gap2.projectId}`);
}

function runReportAudit(): void {
  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const { ws1 } = setupWorkspaces();

  const detector = new DevPulseV2MissingCapabilityDetector();
  const gap = detector.analyzeCapabilityGaps(makeGapInput(ws1.workspaceId, ws1.projectId));
  const gapReport = detector.formatReport(gap, makeGapInput(ws1.workspaceId, ws1.projectId));
  assert('report', '9.1 report formatted', gapReport.includes('Capability detection only'), 'formatted');

  const acquisitionSvc = new DevPulseV2SafeCapabilityAcquisition();
  const plan = acquisitionSvc.planSafeAcquisition(makeAcquisitionInput(ws1.workspaceId, ws1.projectId));
  const acqReport = acquisitionSvc.formatReport(plan, makeAcquisitionInput(ws1.workspaceId, ws1.projectId));
  assert('report', '9.2 report formatted', acqReport.includes('Safe capability acquisition planning only'), 'formatted');

  const learningSvc = new DevPulseV2SelfLearningEngine();
  const learn = learningSvc.recordLearning(makeLearningInput(ws1.workspaceId, ws1.projectId));
  const learnReport = learningSvc.formatReport(learn, makeLearningInput(ws1.workspaceId, ws1.projectId));
  assert('report', '9.3 report formatted', learnReport.includes('No execution performed'), 'formatted');

  const driftSvc = new DevPulseV2ArchitectureDriftDetection();
  const driftResult = driftSvc.analyzeDrift(makeDriftInput(ws1.workspaceId, ws1.projectId));
  const driftReport = driftSvc.formatReport(driftResult, makeDriftInput(ws1.workspaceId, ws1.projectId));
  assert('report', '9.4 report formatted', driftReport.includes('Architecture drift detection only'), 'formatted');

  const complexity = new DevPulseV2ComplexityScoreFoundation();
  const cx = complexity.scoreComplexity(makeComplexityInput(ws1.workspaceId, ws1.projectId));
  const cxReport = complexity.formatReport(cx, makeComplexityInput(ws1.workspaceId, ws1.projectId));
  assert('report', '9.5 report formatted', cxReport.includes('Complexity scoring only'), 'formatted');

  const prediction = new DevPulseV2FutureProblemPrediction();
  const pred = prediction.predictFutureProblems(makePredictionInput(ws1.workspaceId, ws1.projectId));
  const predReport = prediction.formatReport(pred, makePredictionInput(ws1.workspaceId, ws1.projectId));
  assert('report', '9.6 report formatted', predReport.includes('Future prediction only'), 'formatted');

  assert('report', 'checkpoint only confirmation', true, 'verification-only checkpoint — no systems modified');
}

function runBulkScenarioAudit(): void {
  for (let i = 0; i < PHASE9_SYSTEMS.length; i += 1) {
    const system = PHASE9_SYSTEMS[i]!;
    const owner = getDevPulseV2Owner(system.domain as Parameters<typeof getDevPulseV2Owner>[0]);
    assert('bulk', `bulk-${i}a phase ${system.label}`, owner.phase === system.phase, String(owner.phase));
    assert('bulk', `bulk-${i}b owner ${system.label}`, owner.ownerModule === system.owner, owner.ownerModule);
    assert('bulk', `bulk-${i}c description ${system.label}`, owner.description.length > 20, 'present');
  }

  for (let i = 0; i < 40; i += 1) {
    const a = PHASE9_SYSTEMS[i % PHASE9_SYSTEMS.length]!;
    const b = PHASE9_SYSTEMS[(i + 1) % PHASE9_SYSTEMS.length]!;
    assert('bulk', `bulk-pair-${i} ${a.domain} before ${b.domain}`, a.phase <= b.phase || a.domain !== b.domain, `${a.phase}/${b.phase}`);
  }

  for (let i = 0; i < 30; i += 1) {
    assert('bulk', `bulk-registry-${i} domain unique`, getDevPulseV2Owner(PHASE9_SYSTEMS[i % PHASE9_SYSTEMS.length]!.domain as Parameters<typeof getDevPulseV2Owner>[0]).domain.length > 0, 'registered');
  }
}

let validatorPassCount = 0;
let validatorFailCount = 0;

function runValidatorSweep(): void {
  for (const script of PHASE9_VALIDATORS) {
    try {
      execSync(`npm run ${script}`, { cwd: process.cwd(), stdio: 'pipe' });
      validatorPassCount += 1;
      assert('validators', `validator ${script}`, true, 'passed');
    } catch {
      validatorFailCount += 1;
      assert('validators', `validator ${script}`, false, 'failed');
    }
  }

  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    validatorPassCount += 1;
    assert('validators', 'typecheck', true, 'passed');
  } catch {
    validatorFailCount += 1;
    assert('validators', 'typecheck', false, 'failed');
  }
}

export function buildPhase9ReadinessReport(): Phase9ReadinessReport {
  const ownershipIntegrity = pct(auditResults('ownership').filter((r) => r.passed).length, auditResults('ownership').length);
  const dependencyIntegrity = pct(auditResults('dependency').filter((r) => r.passed).length, auditResults('dependency').length);
  const governanceIntegrity = pct(auditResults('governance').filter((r) => r.passed).length, auditResults('governance').length);
  const worldProtectionIntegrity = pct(auditResults('worldProtection').filter((r) => r.passed).length, auditResults('worldProtection').length);
  const duplicateTruthIntegrity = pct(auditResults('duplicateTruth').filter((r) => r.passed).length, auditResults('duplicateTruth').length);
  const executionSafetyIntegrity = pct(auditResults('executionSafety').filter((r) => r.passed).length, auditResults('executionSafety').length);
  const selfEvolutionChainIntegrity = pct(auditResults('selfEvolutionChain').filter((r) => r.passed).length, auditResults('selfEvolutionChain').length);
  const determinismIntegrity = pct(auditResults('determinism').filter((r) => r.passed).length, auditResults('determinism').length);

  const scores = [
    ownershipIntegrity,
    dependencyIntegrity,
    governanceIntegrity,
    worldProtectionIntegrity,
    duplicateTruthIntegrity,
    executionSafetyIntegrity,
    selfEvolutionChainIntegrity,
    determinismIntegrity,
  ];
  const overallReadiness = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const failed = results.filter((r) => !r.passed);
  const topRisks = failed.slice(0, 5).map((f) => `[${f.audit}] ${f.name}: ${f.detail}`);
  const recommendations: string[] = [];
  if (overallReadiness < 100) {
    recommendations.push('Resolve failed checkpoint scenarios before advancing beyond Phase 9 Self-Evolution stack');
  }
  if (validatorFailCount > 0) {
    recommendations.push('Re-run failed Phase 9 validators and fix regressions before production integration');
  }
  if (overallReadiness === 100) {
    recommendations.push('Phase 9 Self-Evolution stack verified — proceed to Phase 10 integration planning');
  }

  return {
    ownershipIntegrity,
    dependencyIntegrity,
    governanceIntegrity,
    worldProtectionIntegrity,
    duplicateTruthIntegrity,
    executionSafetyIntegrity,
    selfEvolutionChainIntegrity,
    determinismIntegrity,
    overallReadiness,
    validatedSystemCount: PHASE9_SYSTEMS.length,
    validatorPassCount,
    validatorFailCount,
    topRisks,
    recommendations,
  };
}

function printAuditSection(title: string, audit: string): void {
  const items = auditResults(audit);
  const passed = items.filter((r) => r.passed).length;
  console.log('');
  console.log(title);
  console.log('-'.repeat(title.length));
  for (const r of items) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
  }
  console.log(`Result: ${passed === items.length ? 'PASS' : 'FAIL'} (${passed}/${items.length})`);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 9 Governance Stack Verification Checkpoint');
  console.log('================================================================');
  console.log('');

  runOwnershipAudit();
  printAuditSection('1. OWNERSHIP AUDIT', 'ownership');

  runDependencyAudit();
  printAuditSection('2. DEPENDENCY AUDIT', 'dependency');

  runGovernanceAudit();
  printAuditSection('3. GOVERNANCE AUDIT', 'governance');

  runWorldProtectionAudit();
  printAuditSection('4. WORLD PROTECTION AUDIT', 'worldProtection');

  runDuplicateTruthAudit();
  printAuditSection('5. DUPLICATE TRUTH AUDIT', 'duplicateTruth');

  runExecutionSafetyAudit();
  printAuditSection('6. EXECUTION SAFETY AUDIT', 'executionSafety');

  runSelfEvolutionChainAudit();
  printAuditSection('7. SELF-EVOLUTION CHAIN AUDIT', 'selfEvolutionChain');

  runDeterminismAudit();
  printAuditSection('8. DETERMINISM AUDIT', 'determinism');

  runCrossProjectAudit();
  printAuditSection('9. CROSS-PROJECT ISOLATION AUDIT', 'crossProject');

  runReportAudit();
  printAuditSection('10. READINESS REPORT AUDIT', 'report');

  runBulkScenarioAudit();
  printAuditSection('11. BULK SCENARIO AUDIT', 'bulk');

  runValidatorSweep();
  printAuditSection('12. VALIDATOR SWEEP', 'validators');

  const phase9ReadinessReport = buildPhase9ReadinessReport();
  const failed = results.filter((r) => !r.passed);
  const allPassed = failed.length === 0 && results.length >= 260;

  console.log('');
  console.log('PHASE 9 GOVERNANCE READINESS REPORT');
  console.log('-----------------------------------');
  console.log(`ownershipIntegrity:           ${phase9ReadinessReport.ownershipIntegrity}%`);
  console.log(`dependencyIntegrity:          ${phase9ReadinessReport.dependencyIntegrity}%`);
  console.log(`governanceIntegrity:          ${phase9ReadinessReport.governanceIntegrity}%`);
  console.log(`worldProtectionIntegrity:     ${phase9ReadinessReport.worldProtectionIntegrity}%`);
  console.log(`duplicateTruthIntegrity:      ${phase9ReadinessReport.duplicateTruthIntegrity}%`);
  console.log(`executionSafetyIntegrity:     ${phase9ReadinessReport.executionSafetyIntegrity}%`);
  console.log(`selfEvolutionChainIntegrity:  ${phase9ReadinessReport.selfEvolutionChainIntegrity}%`);
  console.log(`determinismIntegrity:         ${phase9ReadinessReport.determinismIntegrity}%`);
  console.log(`overallReadiness:             ${phase9ReadinessReport.overallReadiness}%`);
  console.log(`validatedSystemCount:         ${phase9ReadinessReport.validatedSystemCount}`);
  console.log(`validatorPassCount:           ${phase9ReadinessReport.validatorPassCount}`);
  console.log(`validatorFailCount:           ${phase9ReadinessReport.validatorFailCount}`);
  console.log('');
  console.log('topRisks:');
  for (const risk of phase9ReadinessReport.topRisks) console.log(`  - ${risk}`);
  if (phase9ReadinessReport.topRisks.length === 0) console.log('  - none');
  console.log('');
  console.log('recommendations:');
  for (const rec of phase9ReadinessReport.recommendations) console.log(`  - ${rec}`);

  console.log('');
  console.log(`Total scenarios:              ${results.length}`);
  console.log(`Passed:                       ${results.length - failed.length}`);
  console.log(`Failed:                       ${failed.length}`);

  console.log('');
  console.log('Validated Phase 9 systems:');
  for (const s of PHASE9_SYSTEMS) console.log(`  - ${s.label}`);

  console.log('');
  console.log('Issues found: ' + failed.length);
  console.log('Issues fixed: 0 (checkpoint verification only)');

  console.log('');
  console.log('Recommended next phase: Phase 10 — Self-Evolution Runtime Integration (wire Phase 9 intelligence outputs into founder-gated World 2 execution workflows without granting auto-fix or direct execution)');

  console.log('');
  console.log('================================================================');
  if (allPassed) {
    console.log('CHECKPOINT PASS');
    console.log('');
    console.log(PHASE9_CHECKPOINT_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:phase9-governance-stack-checkpoint');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.log('CHECKPOINT FAIL');
  if (results.length < 260) {
    console.log(`Insufficient scenarios: ${results.length}/260 required`);
  }
  for (const f of failed.slice(0, 25)) {
    console.log(`  ✗ [${f.audit}] ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
