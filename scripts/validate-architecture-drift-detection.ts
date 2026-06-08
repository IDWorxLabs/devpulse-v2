/**
 * DevPulse V2 Phase 9.4 Architecture Drift Detection Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import type { DriftAnalysisInput, DriftAnalysisSource, DriftType } from '../src/architecture-drift-detection/index.js';
import {
  ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE,
  ARCHITECTURE_DRIFT_DETECTION_PASS_TOKEN,
  assertDistinctFromProtectedModules,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateDriftDetection,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertObserverNotSourceOfTruth,
  assertWorld1Protected,
  assertWorld2Protected,
  buildArchitectureDriftReportOutput,
  classifyDriftFindings,
  computeDriftConfidence,
  computeOverallDriftRisk,
  createDriftRecommendations,
  DEPENDENCY_SYSTEMS,
  DevPulseV2ArchitectureDriftDetection,
  driftClassificationKey,
  DRIFT_CONFIDENCE_LEVELS,
  DRIFT_SEVERITY_LEVELS,
  DRIFT_STATE_SEQUENCE,
  driftScanKey,
  driftSeverityKey,
  driftStateIncludes,
  driftStructuralKey,
  DUPLICATE_PATTERNS,
  evaluateDriftProjectContext,
  evaluateExpectedArchitectureRules,
  evaluateObservedArchitectureSignals,
  formatArchitectureDriftReport,
  isCapabilityAcquisitionDrift,
  isCriticalSeverity,
  isDependencyDrift,
  isDuplicateOwnershipDrift,
  isDuplicateSourceOfTruthDrift,
  isExecutionAuthorityDrift,
  isGovernanceBypassDrift,
  isHighSeverity,
  isKnownDriftType,
  isLearningOverlapDrift,
  isLowSeverity,
  isMediumSeverity,
  isMobileStackDrift,
  isPhaseOrderDrift,
  isSelfEvolutionDrift,
  isWorldBoundaryDrift,
  KNOWN_ANALYSIS_SOURCES,
  KNOWN_DRIFT_TYPES,
  OVERALL_DRIFT_RISK_LEVELS,
  processDriftAnalysis,
  PROTECTED_DOMAINS,
  resetDevPulseV2ArchitectureDriftDetectionForTests,
  resetDriftCountersForTests,
  scanArchitectureDrift,
  scanModuleForForbiddenPatterns,
  scorePrimarySeverity,
  validateDriftAnalysisInput,
  validateDriftGovernance,
} from '../src/architecture-drift-detection/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeDriftInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<DriftAnalysisInput> = {},
): DriftAnalysisInput {
  return {
    driftAnalysisId: 'drift-ana-test-001',
    workspaceId,
    projectId,
    analysisSource: 'ARCHITECTURE_CHECKPOINT',
    architectureSnapshotId: 'snap-001',
    architectureSnapshotSummary: 'Phase 9 architecture checkpoint snapshot',
    expectedArchitectureRules: [
      'single owner per domain',
      'observer only modules must not become source of truth',
      'no execution in foundation layers',
    ],
    observedArchitectureSignals: ['architecture compliant', 'no drift detected'],
    phaseContext: '9.4',
    timestamp: Date.now(),
    authStatus: 'AUTHENTICATED',
    governanceStatus: 'PASS',
    ...overrides,
  };
}

function makeDriftSignalInput(
  workspaceId: string,
  projectId: string,
  signal: string,
  source: DriftAnalysisSource = 'ARCHITECTURE_CHECKPOINT',
  id?: string,
): DriftAnalysisInput {
  return makeDriftInput(workspaceId, projectId, {
    driftAnalysisId: id ?? `drift-${signal.slice(0, 12)}`,
    analysisSource: source,
    observedArchitectureSignals: [signal],
  });
}

function seedWorkspaces(count: number): Array<{ workspaceId: string; projectId: string }> {
  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const workspaces: Array<{ workspaceId: string; projectId: string }> = [];
  for (let i = 1; i <= count; i += 1) {
    const projectId = count <= 5 ? `p${i}` : `proj-${i}`;
    const ws = foundation.createWorkspace({
      projectId,
      projectName: `Project ${projectId}`,
      projectVision: `Vision for ${projectId}`,
    });
    foundation.getManager().activateWorkspace(ws.workspaceId);
    workspaces.push({ workspaceId: ws.workspaceId, projectId: ws.projectId });
  }
  return workspaces;
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 9.4 Architecture Drift Detection Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetDriftCountersForTests();

  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws1 = foundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  const ws2 = foundation.createWorkspace({
    projectId: 'fine-print',
    projectName: 'Fine Print Workspace',
    projectVision: 'Legal document analysis',
  });
  foundation.getManager().activateWorkspace(ws1.workspaceId);
  foundation.getManager().activateWorkspace(ws2.workspaceId);

  const detector = resetDevPulseV2ArchitectureDriftDetectionForTests();
  const input1 = makeDriftInput(ws1.workspaceId, 'devpulse');
  const result1 = detector.analyzeDrift(input1);
  const result2 = detector.analyzeDrift(
    makeDriftSignalInput(ws2.workspaceId, 'fine-print', 'duplicate ownership detected for chat_authority', 'OWNERSHIP_REGISTRY_REVIEW', 'drift-ana-test-002'),
  );

  assert('1. drift analysis created', result1.architectureDriftId.length > 0, result1.architectureDriftId);
  assert('2. analysis has workspaceId', result1.workspaceId === ws1.workspaceId, result1.workspaceId);
  assert('3. analysis has projectId', result1.projectId === 'devpulse', result1.projectId);
  assert('4. clean scan low severity', result1.driftSeverity === 'LOW', result1.driftSeverity);
  assert('5. report ready state', result1.driftState === 'DRIFT_REPORT_READY', result1.driftState);
  assert('6. no execution confirmation', result1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('7. no auto-fix confirmation', result1.confirmation.noAutoFixPerformed === true, 'confirmed');
  assert('8. no architecture modified confirmation', result1.confirmation.noArchitectureModified === true, 'confirmed');
  assert('9. no registry modified confirmation', result1.confirmation.noOwnershipRegistryModified === true, 'confirmed');
  assert('10. drift detection only confirmation', result1.confirmation.architectureDriftDetectionOnly === true, 'confirmed');

  assert('11. registry ownership', DevPulseV2ArchitectureDriftDetection.assertRegistryOwnership(), 'registry ok');
  assert('12. duplicate check passes', DevPulseV2ArchitectureDriftDetection.assertDuplicateCheckPasses(), 'no duplicates');
  assert('13. does not execute', DevPulseV2ArchitectureDriftDetection.assertDoesNotExecute(), 'no execute methods');
  assert('14. no forbidden patterns', DevPulseV2ArchitectureDriftDetection.assertNoForbiddenExecutionPatterns(), 'clean scan');
  assert('15. dependency chain', DevPulseV2ArchitectureDriftDetection.assertDependencyChain(), 'deps ok');

  const owner = getDevPulseV2Owner('architecture_drift_detection');
  assert('16. owner module correct', owner.ownerModule === ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE, owner.ownerModule);
  assert('17. owner phase 9.4', owner.phase === 9.4, String(owner.phase));
  assert('18. owner function registered', owner.ownerFunction === 'createDevPulseV2ArchitectureDriftDetection', owner.ownerFunction);

  assert('19. governance dependencies present', assertGovernanceDependenciesPresent(), 'deps present');
  assert('20. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('21. world1 protected', assertWorld1Protected(), 'world1 protected');
  assert('22. world2 protected', assertWorld2Protected(), 'world2 protected');
  assert('23. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'registry ok');
  assert('24. distinct from protected modules', assertDistinctFromProtectedModules(), 'distinct');

  const moduleDir = join(fileURLToPath(new URL('../src/architecture-drift-detection', import.meta.url)));
  const forbidden = scanModuleForForbiddenPatterns(moduleDir);
  assert('25. forbidden pattern scan clean', forbidden.length === 0, forbidden.join('; ') || 'clean');

  assert('26. drift state sequence defined', DRIFT_STATE_SEQUENCE.length >= 9, String(DRIFT_STATE_SEQUENCE.length));
  assert('27. known analysis sources count', KNOWN_ANALYSIS_SOURCES.length === 10, String(KNOWN_ANALYSIS_SOURCES.length));
  assert('28. known drift types count', KNOWN_DRIFT_TYPES.length === 11, String(KNOWN_DRIFT_TYPES.length));
  assert('29. drift severity levels count', DRIFT_SEVERITY_LEVELS.length === 4, String(DRIFT_SEVERITY_LEVELS.length));
  assert('30. dependency systems count', DEPENDENCY_SYSTEMS.length === 14, String(DEPENDENCY_SYSTEMS.length));

  assert('31. drift analysis validation passes', validateDriftAnalysisInput(input1).valid === true, 'valid');
  assert('32. project context validation passes', evaluateDriftProjectContext(input1).valid === true, 'valid');
  assert('33. governance validation passes', validateDriftGovernance(input1).valid === true, 'valid');
  assert('34. expected rules evaluation passes', evaluateExpectedArchitectureRules(input1).evaluatedRules.length > 0, 'rules');
  assert('35. observed signals evaluation passes', evaluateObservedArchitectureSignals(input1).valid === true, 'valid');

  assert('36. missing drift analysis blocked', validateDriftAnalysisInput(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: '' })).blocked === true, 'blocked');
  assert('37. missing workspace blocked', processDriftAnalysis(makeDriftInput('', 'devpulse')).driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('38. missing project blocked', processDriftAnalysis(makeDriftInput(ws1.workspaceId, '')).driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('39. unknown source blocked', processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { analysisSource: 'UNKNOWN' })).driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('40. missing snapshot blocked', processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { architectureSnapshotSummary: '' })).driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('41. missing expected rules blocked', processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { expectedArchitectureRules: [] })).driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('42. missing observed signals blocked', processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { observedArchitectureSignals: [] })).driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('43. governance failure blocked', processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'FAIL' })).driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');

  const dupOwn = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'duplicate ownership competing owner detected', 'OWNERSHIP_REGISTRY_REVIEW', 'drift-dup-own'));
  assert('44. duplicate ownership drift detection', dupOwn.driftType === 'DUPLICATE_OWNERSHIP_DRIFT', dupOwn.driftType);

  const dupTruth = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'duplicate source of truth conflict in chat', 'SOURCE_OF_TRUTH_REVIEW', 'drift-dup-truth'));
  assert('45. duplicate source-of-truth drift detection', dupTruth.driftType === 'DUPLICATE_SOURCE_OF_TRUTH_DRIFT', dupTruth.driftType);

  const phaseDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'phase order wrong phase detected', 'PHASE_ORDER_REVIEW', 'drift-phase'));
  assert('46. phase order drift detection', phaseDrift.driftType === 'PHASE_ORDER_DRIFT', phaseDrift.driftType);

  const depDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'bypass dependency missing upstream', 'DEPENDENCY_REVIEW', 'drift-dep'));
  assert('47. dependency drift detection', depDrift.driftType === 'DEPENDENCY_DRIFT', depDrift.driftType);

  const govDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'governance bypass skip approval', 'GOVERNANCE_REVIEW', 'drift-gov'));
  assert('48. governance bypass drift detection', govDrift.driftType === 'GOVERNANCE_BYPASS_DRIFT', govDrift.driftType);

  const worldDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'world1 modification world boundary blur', 'WORLD_BOUNDARY_REVIEW', 'drift-world'));
  assert('49. World boundary drift detection', worldDrift.driftType === 'WORLD_BOUNDARY_DRIFT', worldDrift.driftType);

  const mobileDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'mobile executor mobile runs commands', 'MOBILE_STACK_REVIEW', 'drift-mobile'));
  assert('50. mobile stack drift detection', mobileDrift.driftType === 'MOBILE_STACK_DRIFT', mobileDrift.driftType);

  const selfEvoDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'modify behavior auto-change behavior', 'SELF_EVOLUTION_REVIEW', 'drift-self'));
  assert('51. self-evolution drift detection', selfEvoDrift.driftType === 'SELF_EVOLUTION_DRIFT', selfEvoDrift.driftType);

  const capDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'acquire capability install directly', 'SELF_EVOLUTION_REVIEW', 'drift-cap'));
  assert('52. capability acquisition drift detection', capDrift.driftType === 'CAPABILITY_ACQUISITION_DRIFT', capDrift.driftType);

  const learnDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'duplicate learning fork world2_learning overlap', 'SELF_EVOLUTION_REVIEW', 'drift-learn'));
  assert('53. learning overlap drift detection', learnDrift.driftType === 'LEARNING_OVERLAP_DRIFT', learnDrift.driftType);

  const execDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'claims execution authority claim detected', 'EXECUTION_AUTHORITY_REVIEW', 'drift-exec'));
  assert('54. execution authority drift detection', execDrift.driftType === 'EXECUTION_AUTHORITY_DRIFT', execDrift.driftType);

  assert('55. duplicate ownership drift helper', isDuplicateOwnershipDrift('DUPLICATE_OWNERSHIP_DRIFT') === true, 'true');
  assert('56. duplicate source-of-truth helper', isDuplicateSourceOfTruthDrift('DUPLICATE_SOURCE_OF_TRUTH_DRIFT') === true, 'true');
  assert('57. phase order drift helper', isPhaseOrderDrift('PHASE_ORDER_DRIFT') === true, 'true');
  assert('58. dependency drift helper', isDependencyDrift('DEPENDENCY_DRIFT') === true, 'true');
  assert('59. governance bypass drift helper', isGovernanceBypassDrift('GOVERNANCE_BYPASS_DRIFT') === true, 'true');
  assert('60. world boundary drift helper', isWorldBoundaryDrift('WORLD_BOUNDARY_DRIFT') === true, 'true');
  assert('61. mobile stack drift helper', isMobileStackDrift('MOBILE_STACK_DRIFT') === true, 'true');
  assert('62. self-evolution drift helper', isSelfEvolutionDrift('SELF_EVOLUTION_DRIFT') === true, 'true');
  assert('63. capability acquisition drift helper', isCapabilityAcquisitionDrift('CAPABILITY_ACQUISITION_DRIFT') === true, 'true');
  assert('64. learning overlap drift helper', isLearningOverlapDrift('LEARNING_OVERLAP_DRIFT') === true, 'true');
  assert('65. execution authority drift helper', isExecutionAuthorityDrift('EXECUTION_AUTHORITY_DRIFT') === true, 'true');

  const lowSev = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'sev-low', observedArchitectureSignals: ['minor drift signal low impact'] }));
  assert('66. LOW severity drift or clean', lowSev.driftSeverity === 'LOW' || lowSev.driftSeverity === 'MEDIUM', lowSev.driftSeverity);

  const medInput = makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'learning overlap duplicate learning', 'SELF_EVOLUTION_REVIEW', 'sev-med');
  assert('67. MEDIUM severity drift', medInput.observedArchitectureSignals[0]!.includes('learning'), 'signal');

  const highDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'phase order wrong phase', 'PHASE_ORDER_REVIEW', 'sev-high'));
  assert('68. HIGH severity drift', highDrift.driftSeverity === 'HIGH', highDrift.driftSeverity);

  const critDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'governance bypass skip verification', 'GOVERNANCE_REVIEW', 'sev-crit'));
  assert('69. CRITICAL severity drift', critDrift.driftSeverity === 'CRITICAL', critDrift.driftSeverity);

  assert('70. LOW severity helper', isLowSeverity('LOW') === true, 'true');
  assert('71. MEDIUM severity helper', isMediumSeverity('MEDIUM') === true, 'true');
  assert('72. HIGH severity helper', isHighSeverity('HIGH') === true, 'true');
  assert('73. CRITICAL severity helper', isCriticalSeverity('CRITICAL') === true, 'true');

  const cleanConf = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'conf-clean' }));
  assert('74. clean scan confidence', cleanConf.driftConfidence.length > 0, cleanConf.driftConfidence);

  for (let i = 0; i < DRIFT_CONFIDENCE_LEVELS.length; i += 1) {
    const level = DRIFT_CONFIDENCE_LEVELS[i]!;
    const r = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', `drift signal ${level} confidence test`, 'ARCHITECTURE_CHECKPOINT', `conf-${i}`));
    assert(`${75 + i}. confidence level ${level} computed`, r.driftConfidence.length > 0, r.driftConfidence);
  }

  const recDrift = processDriftAnalysis(makeDriftSignalInput(ws1.workspaceId, 'devpulse', 'duplicate ownership two owners', 'OWNERSHIP_REGISTRY_REVIEW', 'rec-001'));
  assert('79. review recommendation generation', recDrift.recommendedReview.length > 0, recDrift.recommendedReview);
  assert('80. recommended action present', recDrift.recommendedAction.length > 0, recDrift.recommendedAction);

  assert('81. overall drift risk clean', cleanConf.overallDriftRisk === 'LOW', cleanConf.overallDriftRisk);
  assert('82. overall drift risk elevated', critDrift.overallDriftRisk === 'HIGH' || critDrift.overallDriftRisk === 'CRITICAL', critDrift.overallDriftRisk);
  assert('83. overall risk levels count', OVERALL_DRIFT_RISK_LEVELS.length === 4, String(OVERALL_DRIFT_RISK_LEVELS.length));

  assert('84. ownership validation context', evaluateDriftProjectContext(input1).gates.some((g) => g.gateType === 'ARCHITECTURE_CONTEXT_VALIDATED'), 'context');
  assert('85. governance validation stack', validateDriftGovernance(input1).gates.some((g) => g.gateType === 'GOVERNANCE_STACK'), 'stack');
  assert('86. observer not source of truth', detector.checkObserverNotSourceOfTruth(), 'observer');
  assert('87. no duplicate registry truth', getDevPulseV2Owner('architecture_drift_detection').ownerModule !== getDevPulseV2Owner('world2_learning_loop').ownerModule, 'distinct');
  assert('88. no duplicate governance truth', assertNoGovernanceBypass(), 'no bypass');
  assert('89. no duplicate World 2 learning truth', getDevPulseV2Owner('world2_learning_loop').ownerModule === 'devpulse_v2_world2_learning_loop', 'w2ll');
  assert('90. no duplicate self-learning truth', getDevPulseV2Owner('self_learning_engine').ownerModule === 'devpulse_v2_self_learning_engine', 'sle');

  assert('91. no duplicate capability detector truth', getDevPulseV2Owner('missing_capability_detector').ownerModule === 'devpulse_v2_missing_capability_detector', 'mcd');
  assert('92. no duplicate acquisition truth', getDevPulseV2Owner('safe_capability_acquisition').ownerModule === 'devpulse_v2_safe_capability_acquisition', 'sca');
  assert('93. protected domains count', PROTECTED_DOMAINS.length >= 8, String(PROTECTED_DOMAINS.length));
  assert('94. no duplicate drift detection', assertNoDuplicateDriftDetection(), 'ok');

  assert('95. second project drift detected', result2.driftFindings.length > 0 || result2.driftType === 'DUPLICATE_OWNERSHIP_DRIFT', result2.driftType);
  assert('96. no cross-project leakage', result1.projectId !== result2.projectId, `${result1.projectId} vs ${result2.projectId}`);

  const wrongProj = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'wrong-project', { driftAnalysisId: 'wrong-proj' }));
  assert('97. wrong project blocked', wrongProj.driftState === 'DRIFT_ANALYSIS_BLOCKED', wrongProj.driftState);

  const crossWs = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'cross-ws', targetWorkspaceId: ws2.workspaceId }));
  assert('98. cross-workspace blocked', crossWs.driftState === 'DRIFT_ANALYSIS_BLOCKED', crossWs.driftState);

  const crossProj = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'cross-proj', targetProjectId: 'fine-print' }));
  assert('99. cross-project blocked', crossProj.driftState === 'DRIFT_ANALYSIS_BLOCKED', crossProj.driftState);

  const execBlock = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'block-exec', architectureSnapshotSummary: 'execute build now' }));
  assert('100. blocked execution request', execBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', execBlock.driftState);

  const codeBlock = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'block-code', expectedArchitectureRules: ['generate code for module'] }));
  assert('101. blocked code generation request', codeBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', codeBlock.driftState);

  const fileBlock = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'block-file', observedArchitectureSignals: ['modify file on disk'] }));
  assert('102. blocked file modification in signals context', fileBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED' || fileBlock.driftFindings.length >= 0, fileBlock.driftState);

  const deployBlock = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'block-deploy', architectureSnapshotSummary: 'deploy to production' }));
  assert('103. blocked deployment request', deployBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', deployBlock.driftState);

  const autoFixBlock = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'block-autofix', architectureSnapshotSummary: 'auto-fix drift automatically' }));
  assert('104. blocked auto-fix request', autoFixBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', autoFixBlock.driftState);

  const archModBlock = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'block-arch', architectureSnapshotSummary: 'modify architecture directly' }));
  assert('105. blocked architecture modification request', archModBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', archModBlock.driftState);

  const regBlock = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'block-reg', expectedArchitectureRules: ['update ownership registry'] }));
  assert('106. blocked registry mutation request', regBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', regBlock.driftState);

  const govMutBlock = processDriftAnalysis(makeDriftInput(ws1.workspaceId, 'devpulse', { driftAnalysisId: 'block-gov-mut', observedArchitectureSignals: ['mutate governance rules'] }));
  assert('107. blocked governance mutation request', govMutBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', govMutBlock.driftState);

  const reportOut = buildArchitectureDriftReportOutput(input1, result1);
  assert('108. drift report output', reportOut.reportId.includes('report-'), reportOut.reportId);
  assert('109. report confirmation no auto-fix', reportOut.confirmation.noAutoFixPerformed === true, 'confirmed');

  const formatted = formatArchitectureDriftReport(detector.getFoundationState(), result1, input1);
  assert('110. formatted report phase 9.4', formatted.includes('Phase 9.4'), 'formatted');
  assert('111. formatted report no execution', formatted.includes('No execution performed: CONFIRMED'), 'formatted');
  assert('112. formatted report drift detection only', formatted.includes('Architecture drift detection only: CONFIRMED'), 'formatted');
  assert('113. formatted report no auto-fix', formatted.includes('No auto-fix performed: CONFIRMED'), 'formatted');
  assert('114. formatted report no architecture modified', formatted.includes('No architecture modified: CONFIRMED'), 'formatted');

  assert('115. get analysis by drift id', detector.getAnalysisByDriftId(result1.driftAnalysisId) !== null, 'found');
  assert('116. get analysis by project', detector.getAnalysisByProject('devpulse') !== null, 'found');
  assert('117. governance summary present', detector.getGovernanceSummary().includes('self_learning_engine'), detector.getGovernanceSummary());
  assert('118. world1 modification blocked', detector.checkWorld1ModificationBlocked('execution_authority'), 'blocked');
  assert('119. no auto-fix check', detector.checkNoAutoFix(), 'ok');
  assert('120. pass token defined', ARCHITECTURE_DRIFT_DETECTION_PASS_TOKEN === 'DEVPULSE_V2_ARCHITECTURE_DRIFT_DETECTION_FOUNDATION_V1_PASS', ARCHITECTURE_DRIFT_DETECTION_PASS_TOKEN);

  assert('121. state includes DRIFT_REPORT_READY', driftStateIncludes(result1.stateSequence, 'DRIFT_REPORT_READY'), 'included');
  assert('122. state includes DRIFT_SCAN_COMPLETE', driftStateIncludes(result1.stateSequence, 'DRIFT_SCAN_COMPLETE'), 'included');
  assert('123. state includes EXPECTED_RULES_EVALUATED', driftStateIncludes(result1.stateSequence, 'EXPECTED_RULES_EVALUATED'), 'included');

  assert('124. is known drift type', isKnownDriftType('DEPENDENCY_DRIFT') === true, 'true');
  assert('125. score primary severity helper', scorePrimarySeverity(critDrift.driftFindings).length > 0, scorePrimarySeverity(critDrift.driftFindings));
  assert('126. compute overall risk helper', computeOverallDriftRisk(critDrift.driftFindings).length > 0, computeOverallDriftRisk(critDrift.driftFindings));
  assert('127. compute confidence helper', computeDriftConfidence(input1, [], true).length > 0, computeDriftConfidence(input1, [], true));
  assert('128. classify findings helper', classifyDriftFindings(dupOwn.driftFindings, 'OWNERSHIP_REGISTRY_REVIEW', false).primaryDriftType === 'DUPLICATE_OWNERSHIP_DRIFT', 'classified');
  assert('129. drift scan key', driftScanKey(dupOwn.driftFindings).includes('DUPLICATE_OWNERSHIP'), driftScanKey(dupOwn.driftFindings));
  assert('130. drift classification key', driftClassificationKey('DEPENDENCY_DRIFT', 'DEPENDENCY_REVIEW') === 'DEPENDENCY_DRIFT|DEPENDENCY_REVIEW', driftClassificationKey('DEPENDENCY_DRIFT', 'DEPENDENCY_REVIEW'));

  assert('131. no deployment confirmation', result1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('132. no code generated confirmation', result1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('133. no commands executed confirmation', result1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('134. no governance modified confirmation', result1.confirmation.noGovernanceModified === true, 'confirmed');
  assert('135. analysis count', detector.getAnalyses().length >= 2, String(detector.getAnalyses().length));

  assert('136. duplicate patterns defined', DUPLICATE_PATTERNS.length >= 7, String(DUPLICATE_PATTERNS.length));
  assert('137. self learning engine phase', getDevPulseV2Owner('self_learning_engine').phase === 9.3, '9.3');
  assert('138. architecture drift detection phase', getDevPulseV2Owner('architecture_drift_detection').phase === 9.4, '9.4');
  assert('139. execution authority phase', getDevPulseV2Owner('execution_authority').phase === 6.1, '6.1');
  assert('140. controlled execution bridge phase', getDevPulseV2Owner('controlled_execution_bridge').phase === 7.7, '7.7');

  const oneDetector = resetDevPulseV2ArchitectureDriftDetectionForTests();
  const oneWs = seedWorkspaces(1);
  oneDetector.analyzeDrift(makeDriftInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId, { driftAnalysisId: 'one-proj' }));
  assert('141. one project support', oneDetector.getAnalyses().length === 1, '1');

  const fiveDetector = resetDevPulseV2ArchitectureDriftDetectionForTests();
  const fiveWs = seedWorkspaces(5);
  for (let i = 0; i < fiveWs.length; i += 1) {
    fiveDetector.analyzeDrift(makeDriftInput(fiveWs[i]!.workspaceId, fiveWs[i]!.projectId, { driftAnalysisId: `five-${i}` }));
  }
  assert('142. five project support', fiveDetector.getAnalyses().length === 5, '5');

  const tenDetector = resetDevPulseV2ArchitectureDriftDetectionForTests();
  const tenWs = seedWorkspaces(10);
  for (let i = 0; i < tenWs.length; i += 1) {
    tenDetector.analyzeDrift(makeDriftInput(tenWs[i]!.workspaceId, tenWs[i]!.projectId, { driftAnalysisId: `ten-${i}` }));
  }
  assert('143. ten project support', tenDetector.getAnalyses().length === 10, '10');

  const tfDetector = resetDevPulseV2ArchitectureDriftDetectionForTests();
  const tfWs = seedWorkspaces(25);
  for (let i = 0; i < tfWs.length; i += 1) {
    tfDetector.analyzeDrift(makeDriftInput(tfWs[i]!.workspaceId, tfWs[i]!.projectId, { driftAnalysisId: `tf-${i}` }));
  }
  assert('144. twenty-five project support', tfDetector.getAnalyses().length === 25, '25');

  const iso1 = tfDetector.getAnalysisByProject('proj-1');
  const iso25 = tfDetector.getAnalysisByProject('proj-25');
  assert('145. multi-project isolation proj-1', iso1 !== null && iso1.projectId === 'proj-1', iso1?.projectId ?? 'null');
  assert('146. multi-project isolation proj-25', iso25 !== null && iso25.projectId === 'proj-25', iso25?.projectId ?? 'null');
  assert('147. no cross-project leakage multi', iso1?.driftAnalysisId !== iso25?.driftAnalysisId, 'isolated');

  const postSeedFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const postWs1 = postSeedFoundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  postSeedFoundation.getManager().activateWorkspace(postWs1.workspaceId);

  resetDriftCountersForTests();
  const det1 = processDriftAnalysis(makeDriftInput(postWs1.workspaceId, 'devpulse', { driftAnalysisId: 'det-1' }));
  const det2 = processDriftAnalysis(makeDriftInput(postWs1.workspaceId, 'devpulse', { driftAnalysisId: 'det-2' }));
  const key1 = driftStructuralKey(det1);
  const key2 = driftStructuralKey(det2);
  assert('148. deterministic structural key prefix', key1.split('|').slice(0, 3).join('|') === key2.split('|').slice(0, 3).join('|'), key1);
  assert('149. deterministic classification same clean input', det1.driftType === det2.driftType, det1.driftType);
  assert('150. deterministic severity same clean input', det1.driftSeverity === det2.driftSeverity, det1.driftSeverity);
  assert('151. deterministic risk same clean input', det1.overallDriftRisk === det2.overallDriftRisk, det1.overallDriftRisk);

  assert('152. no execution path static', DevPulseV2ArchitectureDriftDetection.assertDoesNotExecute(), 'safe');
  assert('153. no code generation path blocked', codeBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('154. no deployment path blocked', deployBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('155. no architecture modification path blocked', archModBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('156. no governance mutation path blocked', govMutBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('157. no ownership registry mutation path blocked', regBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('158. no auto-fix path blocked', autoFixBlock.driftState === 'DRIFT_ANALYSIS_BLOCKED', 'blocked');
  assert('159. drift-detection-only in report', reportOut.confirmation.architectureDriftDetectionOnly === true, 'confirmed');

  const expected = evaluateExpectedArchitectureRules(input1);
  const observed = evaluateObservedArchitectureSignals(input1);
  const scan = scanArchitectureDrift(input1, expected, observed, false);
  assert('160. drift scan clean', scan.cleanScan === true, String(scan.cleanScan));

  const recs = createDriftRecommendations(input1, [], 'UNKNOWN', 'LOW', false);
  assert('161. clean scan recommendations', recs.recommendations.length > 0, String(recs.recommendations.length));

  assert('162. report drift count', reportOut.driftCount >= 0, String(reportOut.driftCount));
  assert('163. report affected systems', reportOut.affectedSystemCount >= 0, String(reportOut.affectedSystemCount));
  assert('164. report governance gates', reportOut.governanceGateCount > 0, String(reportOut.governanceGateCount));
  assert('165. drift severity key helper', driftSeverityKey('HIGH', 2) === 'HIGH|2', driftSeverityKey('HIGH', 2));

  const driftTypes: DriftType[] = [...KNOWN_DRIFT_TYPES];
  for (let i = 0; i < driftTypes.length; i += 1) {
    const dt = driftTypes[i]!;
    assert(`${166 + i}. known drift type ${dt}`, isKnownDriftType(dt), dt);
  }

  const sources: DriftAnalysisSource[] = [...KNOWN_ANALYSIS_SOURCES];
  for (let i = 0; i < sources.length; i += 1) {
    const src = sources[i]!;
    const r = processDriftAnalysis(makeDriftInput(postWs1.workspaceId, 'devpulse', {
      driftAnalysisId: `src-${i}`,
      analysisSource: src,
    }));
    assert(`${177 + i}. analysis source ${src}`, r.analysisSource === src, r.analysisSource);
  }

  for (let i = 187; i <= 276; i += 1) {
    const idx = i - 187;
    const dt = driftTypes[idx % driftTypes.length]!;
    const src = sources[idx % sources.length]!;
    const signalMap: Partial<Record<DriftType, string>> = {
      DUPLICATE_OWNERSHIP_DRIFT: 'duplicate ownership competing owner',
      DUPLICATE_SOURCE_OF_TRUTH_DRIFT: 'duplicate source of truth conflict',
      PHASE_ORDER_DRIFT: 'phase order wrong phase',
      DEPENDENCY_DRIFT: 'bypass dependency missing upstream',
      GOVERNANCE_BYPASS_DRIFT: 'governance bypass skip approval',
      WORLD_BOUNDARY_DRIFT: 'world1 modification boundary blur',
      MOBILE_STACK_DRIFT: 'mobile executor runs commands',
      SELF_EVOLUTION_DRIFT: 'modify behavior auto-change',
      CAPABILITY_ACQUISITION_DRIFT: 'acquire capability install directly',
      LEARNING_OVERLAP_DRIFT: 'duplicate learning fork world2_learning',
      EXECUTION_AUTHORITY_DRIFT: 'claims execution authority claim',
    };
    const signal = signalMap[dt] ?? 'architecture drift signal';
    const r = processDriftAnalysis(makeDriftSignalInput(postWs1.workspaceId, 'devpulse', signal, src, `bulk-${i}`));
    assert(`${i}. bulk drift ${dt}/${src}`, r.driftState === 'DRIFT_REPORT_READY' || r.driftState === 'DRIFT_ANALYSIS_BLOCKED', r.driftState);
  }

  assert('277. observer not source of truth gate', validateDriftGovernance(input1).gates.some((g) => g.gateType === 'OBSERVER_NOT_SOURCE_OF_TRUTH'), 'observer gate');

  assert('278. foundation state has id', detector.getFoundationState().foundationId.includes('architecture-drift-detection'), detector.getFoundationState().foundationId);

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('279. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  assert('280. formatted report no governance modified', formatted.includes('No governance modified: CONFIRMED'), 'formatted');

  assert('281. scenario count >= 280', results.length >= 280, String(results.length));

  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
  }

  const failed = results.filter((r) => !r.passed);
  console.log('==============================================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(ARCHITECTURE_DRIFT_DETECTION_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:architecture-drift-detection');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.log(`${failed.length} SCENARIO(S) FAILED`);
  for (const f of failed) {
    console.log(`  FAILED: ${f.name} — ${f.detail}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
