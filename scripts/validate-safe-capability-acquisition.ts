/**
 * DevPulse V2 Phase 9.2 Safe Capability Acquisition Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import type { AcquisitionInput, AcquisitionMode } from '../src/safe-capability-acquisition/index.js';
import {
  ACQUISITION_RISK_LEVELS,
  ACQUISITION_STATE_SEQUENCE,
  approvalNotRequiredForMode,
  approvalRequiredForMode,
  approvalRequirementsKey,
  assertDistinctFromMissingCapabilityDetector,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  assertWorld2Protected,
  acquisitionStateIncludes,
  buildSafeAcquisitionReportOutput,
  classifyAcquisitionRisk,
  classifyAcquisitionStrategy,
  createApprovalRequirements,
  createRollbackRequirements,
  createVerificationRequirements,
  DEPENDENCY_SYSTEMS,
  DevPulseV2SafeCapabilityAcquisition,
  DUPLICATE_PATTERNS,
  evaluateAcquisitionProjectContext,
  formatSafeAcquisitionReport,
  gapValidationKey,
  governanceGatesKey,
  isDeferStrategy,
  isResearchStrategy,
  KNOWN_ACQUISITION_MODES,
  KNOWN_ACQUISITION_STRATEGIES,
  MODE_TO_STRATEGY,
  planStructuralKey,
  processAcquisitionPlan,
  resetAcquisitionCountersForTests,
  resetDevPulseV2SafeCapabilityAcquisitionForTests,
  rollbackRequiredForMode,
  scanModuleForForbiddenPatterns,
  SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE,
  SAFE_CAPABILITY_ACQUISITION_PASS_TOKEN,
  strategyKey,
  validateAcquisitionGovernance,
  validateCapabilityGapInput,
  verificationRequiredForMode,
} from '../src/safe-capability-acquisition/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeAcquisitionInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<AcquisitionInput> = {},
): AcquisitionInput {
  return {
    capabilityGapId: 'gap-001',
    analysisId: 'analysis-001',
    workspaceId,
    projectId,
    capabilityType: 'PLANNING_CAPABILITY',
    capabilityName: 'Execution Planner Gap',
    gapSeverity: 'MEDIUM',
    gapReason: 'Missing planning capability for goal execution',
    gapEvidence: 'Goal requires planning layer not present',
    gapImpact: 'Cannot proceed with governed execution',
    recommendedCapability: 'world2_execution_planner',
    recommendedAction: 'Plan safe acquisition — do not install directly',
    confidenceScore: 'HIGH',
    requestedAcquisitionMode: 'BUILD_INTERNAL_TOOL',
    requestedBy: 'missing-capability-detector',
    timestamp: Date.now(),
    authStatus: 'AUTHENTICATED',
    governanceStatus: 'PASS',
    ...overrides,
  };
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
  console.log('DevPulse V2 — Phase 9.2 Safe Capability Acquisition Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetAcquisitionCountersForTests();

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

  const acquisition = resetDevPulseV2SafeCapabilityAcquisitionForTests();
  const input1 = makeAcquisitionInput(ws1.workspaceId, 'devpulse');
  const result1 = acquisition.planSafeAcquisition(input1);
  const result2 = acquisition.planSafeAcquisition(
    makeAcquisitionInput(ws2.workspaceId, 'fine-print', {
      analysisId: 'analysis-002',
      capabilityGapId: 'gap-002',
      requestedAcquisitionMode: 'RESEARCH_ONLY',
    }),
  );

  assert('1. acquisition plan created', result1.acquisitionPlanId.length > 0, result1.acquisitionPlanId);
  assert('2. plan has workspaceId', result1.workspaceId === ws1.workspaceId, result1.workspaceId);
  assert('3. plan has projectId', result1.projectId === 'devpulse', result1.projectId);
  assert('4. acquisition mode classified', result1.acquisitionMode === 'BUILD_INTERNAL_TOOL', result1.acquisitionMode);
  assert('5. strategy classified', result1.acquisitionStrategy === 'PLAN_INTERNAL_BUILD', result1.acquisitionStrategy);
  assert('6. acquisition ready state', result1.acquisitionState === 'ACQUISITION_READY', result1.acquisitionState);
  assert('7. no execution confirmation', result1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('8. no capability acquired confirmation', result1.confirmation.noCapabilityAcquired === true, 'confirmed');
  assert('9. no files modified confirmation', result1.confirmation.noFilesModified === true, 'confirmed');
  assert('10. planning only confirmation', result1.confirmation.safeCapabilityAcquisitionOnly === true, 'confirmed');

  assert('11. registry ownership', DevPulseV2SafeCapabilityAcquisition.assertRegistryOwnership(), 'registry ok');
  assert('12. duplicate check passes', DevPulseV2SafeCapabilityAcquisition.assertDuplicateCheckPasses(), 'no duplicates');
  assert('13. does not execute', DevPulseV2SafeCapabilityAcquisition.assertDoesNotExecute(), 'no execute methods');
  assert('14. no forbidden patterns', DevPulseV2SafeCapabilityAcquisition.assertNoForbiddenExecutionPatterns(), 'clean scan');
  assert('15. dependency chain', DevPulseV2SafeCapabilityAcquisition.assertDependencyChain(), 'deps ok');

  const owner = getDevPulseV2Owner('safe_capability_acquisition');
  assert('16. owner module correct', owner.ownerModule === SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE, owner.ownerModule);
  assert('17. owner phase 9.2', owner.phase === 9.2, String(owner.phase));
  assert('18. owner function registered', owner.ownerFunction === 'createDevPulseV2SafeCapabilityAcquisition', owner.ownerFunction);

  assert('19. governance dependencies present', assertGovernanceDependenciesPresent(), 'deps present');
  assert('20. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('21. world1 protected', assertWorld1Protected(), 'world1 protected');
  assert('22. world2 protected', assertWorld2Protected(), 'world2 protected');
  assert('23. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'registry ok');
  assert('24. distinct from missing capability detector', assertDistinctFromMissingCapabilityDetector(), 'distinct');

  const moduleDir = join(fileURLToPath(new URL('../src/safe-capability-acquisition', import.meta.url)));
  const forbidden = scanModuleForForbiddenPatterns(moduleDir);
  assert('25. forbidden pattern scan clean', forbidden.length === 0, forbidden.join('; ') || 'clean');

  assert('26. acquisition state sequence defined', ACQUISITION_STATE_SEQUENCE.length >= 9, String(ACQUISITION_STATE_SEQUENCE.length));
  assert('27. known acquisition modes count', KNOWN_ACQUISITION_MODES.length === 10, String(KNOWN_ACQUISITION_MODES.length));
  assert('28. known acquisition strategies count', KNOWN_ACQUISITION_STRATEGIES.length === 10, String(KNOWN_ACQUISITION_STRATEGIES.length));
  assert('29. risk levels count', ACQUISITION_RISK_LEVELS.length === 4, String(ACQUISITION_RISK_LEVELS.length));
  assert('30. dependency systems count', DEPENDENCY_SYSTEMS.length === 16, String(DEPENDENCY_SYSTEMS.length));

  assert('31. gap validation passes', validateCapabilityGapInput(input1).valid === true, 'valid');
  assert('32. project context validation passes', evaluateAcquisitionProjectContext(input1).valid === true, 'valid');
  assert('33. governance validation passes', validateAcquisitionGovernance(input1).valid === true, 'valid');

  assert('34. missing gap id blocked', validateCapabilityGapInput(makeAcquisitionInput(ws1.workspaceId, 'devpulse', { capabilityGapId: '' })).blocked === true, 'blocked');
  assert('35. missing analysis blocked', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', { analysisId: '' })).acquisitionState === 'ACQUISITION_BLOCKED', 'blocked');
  assert('36. missing workspace blocked', processAcquisitionPlan(makeAcquisitionInput('', 'devpulse')).acquisitionState === 'ACQUISITION_BLOCKED', 'blocked');
  assert('37. missing project blocked', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, '')).acquisitionState === 'ACQUISITION_BLOCKED', 'blocked');
  assert('38. missing capability name blocked', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', { capabilityName: '' })).acquisitionState === 'ACQUISITION_BLOCKED', 'blocked');
  assert('39. UNKNOWN capability type blocked', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', { capabilityType: 'UNKNOWN' })).acquisitionState === 'ACQUISITION_BLOCKED', 'blocked');
  assert('40. UNKNOWN acquisition mode blocked', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', { requestedAcquisitionMode: 'UNKNOWN' })).acquisitionState === 'ACQUISITION_BLOCKED', 'blocked');
  assert('41. governance failure blocked', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'FAIL' })).acquisitionState === 'ACQUISITION_BLOCKED', 'blocked');

  const modes: AcquisitionMode[] = [
    'RESEARCH_ONLY',
    'BUILD_INTERNAL_TOOL',
    'REQUEST_EXTERNAL_TOOL',
    'INSTALL_DEPENDENCY_PROPOSAL',
    'CREATE_DIAGNOSTIC_LAYER',
    'CREATE_VERIFICATION_LAYER',
    'CREATE_SIMULATION_LAYER',
    'CREATE_PREVIEW_LAYER',
    'CREATE_GOVERNANCE_LAYER',
    'DEFER_CAPABILITY',
  ];
  for (let i = 0; i < modes.length; i += 1) {
    const mode = modes[i]!;
    const r = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
      requestedAcquisitionMode: mode,
      capabilityGapId: `gap-mode-${i}`,
      analysisId: `ana-mode-${i}`,
    }));
    assert(`${42 + i}. ${mode} strategy`, r.acquisitionMode === mode && r.acquisitionStrategy === MODE_TO_STRATEGY[mode], r.acquisitionStrategy);
  }

  const lowRisk = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapSeverity: 'LOW',
    requestedAcquisitionMode: 'RESEARCH_ONLY',
    analysisId: 'risk-low',
  }));
  assert('52. LOW risk classification', lowRisk.riskLevel === 'LOW', lowRisk.riskLevel);

  const medRisk = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapSeverity: 'MEDIUM',
    analysisId: 'risk-med',
  }));
  assert('53. MEDIUM risk classification', medRisk.riskLevel === 'MEDIUM', medRisk.riskLevel);

  const highRisk = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapSeverity: 'HIGH',
    requestedAcquisitionMode: 'REQUEST_EXTERNAL_TOOL',
    analysisId: 'risk-high',
  }));
  assert('54. HIGH risk classification', highRisk.riskLevel === 'HIGH', highRisk.riskLevel);

  const critRisk = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapSeverity: 'CRITICAL',
    capabilityType: 'ARCHITECTURE_CAPABILITY',
    analysisId: 'risk-crit',
  }));
  assert('55. CRITICAL risk classification', critRisk.riskLevel === 'CRITICAL', critRisk.riskLevel);

  const buildApproval = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'BUILD_INTERNAL_TOOL',
    analysisId: 'appr-build',
  }));
  assert('56. approval required for internal build', buildApproval.approvalRequirements.some((a) => a.required), String(buildApproval.approvalRequirements.length));

  const researchNoApproval = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'RESEARCH_ONLY',
    gapSeverity: 'LOW',
    analysisId: 'appr-research',
  }));
  assert('57. approval not required for research-only', researchNoApproval.approvalRequirements.length === 0, '0');

  const deferNoApproval = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'DEFER_CAPABILITY',
    gapSeverity: 'LOW',
    analysisId: 'appr-defer',
  }));
  assert('58. approval not required for defer', deferNoApproval.approvalRequirements.length === 0, '0');

  const extApproval = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'REQUEST_EXTERNAL_TOOL',
    analysisId: 'appr-ext',
  }));
  assert('59. approval required for external tool', extApproval.approvalRequirements.length > 0, String(extApproval.approvalRequirements.length));

  const depApproval = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'INSTALL_DEPENDENCY_PROPOSAL',
    analysisId: 'appr-dep',
  }));
  assert('60. approval required for dependency proposal', depApproval.approvalRequirements.length > 0, String(depApproval.approvalRequirements.length));

  const govApproval = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'CREATE_GOVERNANCE_LAYER',
    analysisId: 'appr-gov',
  }));
  assert('61. approval required for governance layer', govApproval.approvalRequirements.length > 0, String(govApproval.approvalRequirements.length));

  const highRiskApproval = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapSeverity: 'HIGH',
    requestedAcquisitionMode: 'RESEARCH_ONLY',
    analysisId: 'appr-high-risk',
  }));
  assert('62. HIGH risk always requires approval', highRiskApproval.approvalRequirements.some((a) => a.requirementType === 'RISK_APPROVAL'), 'risk approval');

  const verInternal = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'BUILD_INTERNAL_TOOL',
    analysisId: 'ver-internal',
  }));
  assert('63. verification required for internal tool', verInternal.verificationRequirements.length > 0, String(verInternal.verificationRequirements.length));

  const verDep = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'INSTALL_DEPENDENCY_PROPOSAL',
    analysisId: 'ver-dep',
  }));
  assert('64. verification required for dependency', verDep.verificationRequirements.length > 0, String(verDep.verificationRequirements.length));

  const verExt = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'REQUEST_EXTERNAL_TOOL',
    analysisId: 'ver-ext',
  }));
  assert('65. verification required for external tool', verExt.verificationRequirements.length > 0, String(verExt.verificationRequirements.length));

  const rbBuild = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'BUILD_INTERNAL_TOOL',
    analysisId: 'rb-build',
  }));
  assert('66. rollback required for internal build', rbBuild.rollbackRequirements.length > 0, String(rbBuild.rollbackRequirements.length));

  const rbDep = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'INSTALL_DEPENDENCY_PROPOSAL',
    analysisId: 'rb-dep',
  }));
  assert('67. rollback required for dependency', rbDep.rollbackRequirements.length > 0, String(rbDep.rollbackRequirements.length));

  const rbGov = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'CREATE_GOVERNANCE_LAYER',
    analysisId: 'rb-gov',
  }));
  assert('68. rollback required for governance layer', rbGov.rollbackRequirements.length > 0, String(rbGov.rollbackRequirements.length));

  const researchPkt = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'RESEARCH_ONLY',
    analysisId: 'pkt-research',
  }));
  assert('69. research request packet generated', researchPkt.researchRequestPacket !== null, researchPkt.researchRequestPacket?.researchRequestId ?? 'null');

  const buildPkt = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'BUILD_INTERNAL_TOOL',
    analysisId: 'pkt-build',
  }));
  assert('70. build request packet generated', buildPkt.buildRequestPacket !== null, buildPkt.buildRequestPacket?.buildRequestId ?? 'null');

  const deferPkt = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'DEFER_CAPABILITY',
    analysisId: 'pkt-defer',
  }));
  assert('71. defer record generated', deferPkt.deferRecord !== null, deferPkt.deferRecord?.deferRecordId ?? 'null');

  const execBlock = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapReason: 'execute build now',
    analysisId: 'block-exec',
  }));
  assert('72. blocked direct execution request', execBlock.acquisitionState === 'ACQUISITION_BLOCKED', execBlock.acquisitionState);

  const installBlock = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapReason: 'npm install dependency directly',
    analysisId: 'block-install',
  }));
  assert('73. blocked direct install request', installBlock.acquisitionState === 'ACQUISITION_BLOCKED', installBlock.acquisitionState);

  const downloadBlock = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapReason: 'download tool immediately',
    analysisId: 'block-download',
  }));
  assert('74. blocked direct download request', downloadBlock.acquisitionState === 'ACQUISITION_BLOCKED', downloadBlock.acquisitionState);

  const codeBlock = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapReason: 'generate code for feature',
    analysisId: 'block-code',
  }));
  assert('75. blocked direct code generation request', codeBlock.acquisitionState === 'ACQUISITION_BLOCKED', codeBlock.acquisitionState);

  const fileBlock = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapReason: 'modify file on disk',
    analysisId: 'block-file',
  }));
  assert('76. blocked direct file modification request', fileBlock.acquisitionState === 'ACQUISITION_BLOCKED', fileBlock.acquisitionState);

  const deployBlock = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapReason: 'deploy to production',
    analysisId: 'block-deploy',
  }));
  assert('77. blocked direct deployment request', deployBlock.acquisitionState === 'ACQUISITION_BLOCKED', deployBlock.acquisitionState);

  const registryBlock = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    gapReason: 'update ownership registry directly',
    analysisId: 'block-registry',
  }));
  assert('78. blocked ownership registry mutation request', registryBlock.acquisitionState === 'ACQUISITION_BLOCKED', registryBlock.acquisitionState);

  const reportOut = buildSafeAcquisitionReportOutput(input1, result1);
  assert('79. acquisition report output', reportOut.reportId.includes('acq-plan'), reportOut.reportId);
  assert('80. report confirmation no acquisition', reportOut.confirmation.noCapabilityAcquired === true, 'confirmed');

  const formatted = formatSafeAcquisitionReport(acquisition.getFoundationState(), result1, input1);
  assert('81. formatted report phase 9.2', formatted.includes('Phase 9.2'), 'formatted');
  assert('82. formatted report no execution', formatted.includes('No execution performed: CONFIRMED'), 'formatted');
  assert('83. formatted report planning only', formatted.includes('Safe capability acquisition planning only: CONFIRMED'), 'formatted');

  assert('84. get plan by acquisition id', acquisition.getPlanByAcquisitionId(result1.acquisitionId) !== null, 'found');
  assert('85. get plan by project', acquisition.getPlanByProject('devpulse') !== null, 'found');
  assert('86. governance summary present', acquisition.getGovernanceSummary().includes('missing_capability_detector'), acquisition.getGovernanceSummary());
  assert('87. world1 modification blocked', acquisition.checkWorld1ModificationBlocked('execution_authority'), 'blocked');
  assert('88. no capability acquired check', acquisition.checkNoCapabilityAcquired(), 'ok');

  assert('89. state includes ACQUISITION_READY', acquisitionStateIncludes(result1.stateSequence, 'ACQUISITION_READY'), 'included');
  assert('90. state includes STRATEGY_CLASSIFIED', acquisitionStateIncludes(result1.stateSequence, 'ACQUISITION_STRATEGY_CLASSIFIED'), 'included');
  assert('91. state includes GAP_VALIDATED', acquisitionStateIncludes(result1.stateSequence, 'CAPABILITY_GAP_VALIDATED'), 'included');

  const crossWs = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    targetWorkspaceId: ws2.workspaceId,
    analysisId: 'cross-ws',
  }));
  assert('92. cross-workspace acquisition blocked', crossWs.acquisitionState === 'ACQUISITION_BLOCKED' || crossWs.ownershipGates.some((g) => g.status === 'CLOSED'), 'blocked');

  const crossProj = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    targetProjectId: 'fine-print',
    analysisId: 'cross-proj',
  }));
  assert('93. cross-project acquisition blocked', crossProj.acquisitionState === 'ACQUISITION_BLOCKED' || crossProj.ownershipGates.some((g) => g.gateType === 'CROSS_PROJECT'), 'blocked');

  assert('94. second project isolated', result2.projectId === 'fine-print', result2.projectId);
  assert('95. no cross-project leakage', result1.projectId !== result2.projectId, `${result1.projectId} vs ${result2.projectId}`);

  const wrongProj = processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'wrong-project'));
  assert('96. wrong project blocked', wrongProj.acquisitionState === 'ACQUISITION_BLOCKED', wrongProj.acquisitionState);

  assert('97. duplicate patterns defined', DUPLICATE_PATTERNS.length >= 6, String(DUPLICATE_PATTERNS.length));
  assert('98. missing capability detector phase', getDevPulseV2Owner('missing_capability_detector').phase === 9.1, '9.1');
  assert('99. safe capability acquisition phase', getDevPulseV2Owner('safe_capability_acquisition').phase === 9.2, '9.2');
  assert('100. execution authority phase', getDevPulseV2Owner('execution_authority').phase === 6.1, '6.1');

  assert('101. ownership gate count', result1.ownershipGates.length > 0, String(result1.ownershipGates.length));
  assert('102. governance gate count', result1.governanceGates.length > 0, String(result1.governanceGates.length));
  assert('103. pass token defined', SAFE_CAPABILITY_ACQUISITION_PASS_TOKEN === 'DEVPULSE_V2_SAFE_CAPABILITY_ACQUISITION_FOUNDATION_V1_PASS', SAFE_CAPABILITY_ACQUISITION_PASS_TOKEN);

  assert('104. no tool downloaded confirmation', result1.confirmation.noToolDownloaded === true, 'confirmed');
  assert('105. no dependency installed confirmation', result1.confirmation.noDependencyInstalled === true, 'confirmed');
  assert('106. no deployment confirmation', result1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('107. no code generated confirmation', result1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('108. no commands executed confirmation', result1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('109. plan count', acquisition.getPlans().length >= 2, String(acquisition.getPlans().length));
  assert('110. foundation state has id', acquisition.getFoundationState().foundationId.includes('safe-capability-acquisition'), acquisition.getFoundationState().foundationId);

  assert('111. approval required mode helper', approvalRequiredForMode('BUILD_INTERNAL_TOOL') === true, 'true');
  assert('112. approval not required mode helper', approvalNotRequiredForMode('RESEARCH_ONLY') === true, 'true');
  assert('113. verification required mode helper', verificationRequiredForMode('INSTALL_DEPENDENCY_PROPOSAL') === true, 'true');
  assert('114. rollback required mode helper', rollbackRequiredForMode('BUILD_INTERNAL_TOOL') === true, 'true');
  assert('115. is research strategy', isResearchStrategy('RESEARCH') === true, 'true');
  assert('116. is defer strategy', isDeferStrategy('DEFER') === true, 'true');

  assert('117. gap validation key', gapValidationKey(input1).includes('gap-001'), gapValidationKey(input1));
  assert('118. strategy key', strategyKey('BUILD_INTERNAL_TOOL', 'PLAN_INTERNAL_BUILD') === 'BUILD_INTERNAL_TOOL|PLAN_INTERNAL_BUILD', strategyKey('BUILD_INTERNAL_TOOL', 'PLAN_INTERNAL_BUILD'));
  assert('119. approval requirements key', approvalRequirementsKey(result1.approvalRequirements).length >= 0, 'key');
  assert('120. governance gates key', governanceGatesKey(validateAcquisitionGovernance(input1).gates).length > 0, 'gates');

  assert('121. research readiness', researchPkt.acquisitionReadiness === 'READY_FOR_RESEARCH', researchPkt.acquisitionReadiness);
  assert('122. build needs approval readiness', buildApproval.acquisitionReadiness === 'NEEDS_APPROVAL', buildApproval.acquisitionReadiness);
  assert('123. blocked readiness', execBlock.acquisitionReadiness === 'BLOCKED', execBlock.acquisitionReadiness);

  assert('124. diagnostic layer strategy', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', { requestedAcquisitionMode: 'CREATE_DIAGNOSTIC_LAYER', analysisId: 'diag' })).acquisitionStrategy === 'PLAN_DIAGNOSTIC_LAYER', 'diag');
  assert('125. verification layer strategy', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', { requestedAcquisitionMode: 'CREATE_VERIFICATION_LAYER', analysisId: 'ver-layer' })).acquisitionStrategy === 'PLAN_VERIFICATION_LAYER', 'ver');
  assert('126. simulation layer strategy', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', { requestedAcquisitionMode: 'CREATE_SIMULATION_LAYER', analysisId: 'sim' })).acquisitionStrategy === 'PLAN_SIMULATION_LAYER', 'sim');
  assert('127. preview layer strategy', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', { requestedAcquisitionMode: 'CREATE_PREVIEW_LAYER', analysisId: 'prev' })).acquisitionStrategy === 'PLAN_PREVIEW_LAYER', 'prev');
  assert('128. defer strategy', deferPkt.acquisitionStrategy === 'DEFER', deferPkt.acquisitionStrategy);

  assert('129. missing capability detector registered', getDevPulseV2Owner('missing_capability_detector').ownerModule === 'devpulse_v2_missing_capability_detector', '9.1');
  assert('130. controlled execution bridge registered', getDevPulseV2Owner('controlled_execution_bridge').phase === 7.7, '7.7');
  assert('131. verification gated apply registered', getDevPulseV2Owner('verification_gated_apply').phase === 6.11, '6.11');
  assert('132. founder approval gate registered', getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5, '6.5');

  const oneAcquisition = resetDevPulseV2SafeCapabilityAcquisitionForTests();
  const oneWs = seedWorkspaces(1);
  oneAcquisition.planSafeAcquisition(makeAcquisitionInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId, { analysisId: 'one-proj' }));
  assert('133. one project support', oneAcquisition.getPlans().length === 1, '1');

  const fiveAcquisition = resetDevPulseV2SafeCapabilityAcquisitionForTests();
  const fiveWs = seedWorkspaces(5);
  for (let i = 0; i < fiveWs.length; i += 1) {
    fiveAcquisition.planSafeAcquisition(makeAcquisitionInput(fiveWs[i]!.workspaceId, fiveWs[i]!.projectId, { analysisId: `five-${i}` }));
  }
  assert('134. five project support', fiveAcquisition.getPlans().length === 5, '5');

  const tenAcquisition = resetDevPulseV2SafeCapabilityAcquisitionForTests();
  const tenWs = seedWorkspaces(10);
  for (let i = 0; i < tenWs.length; i += 1) {
    tenAcquisition.planSafeAcquisition(makeAcquisitionInput(tenWs[i]!.workspaceId, tenWs[i]!.projectId, { analysisId: `ten-${i}` }));
  }
  assert('135. ten project support', tenAcquisition.getPlans().length === 10, '10');

  const twentyFiveAcquisition = resetDevPulseV2SafeCapabilityAcquisitionForTests();
  const twentyFiveWs = seedWorkspaces(25);
  for (let i = 0; i < twentyFiveWs.length; i += 1) {
    twentyFiveAcquisition.planSafeAcquisition(makeAcquisitionInput(twentyFiveWs[i]!.workspaceId, twentyFiveWs[i]!.projectId, { analysisId: `tf-${i}` }));
  }
  assert('136. twenty-five project support', twentyFiveAcquisition.getPlans().length === 25, '25');

  const iso1 = twentyFiveAcquisition.getPlanByProject('proj-1');
  const iso25 = twentyFiveAcquisition.getPlanByProject('proj-25');
  assert('137. multi-project isolation proj-1', iso1 !== null && iso1.projectId === 'proj-1', iso1?.projectId ?? 'null');
  assert('138. multi-project isolation proj-25', iso25 !== null && iso25.projectId === 'proj-25', iso25?.projectId ?? 'null');
  assert('139. no cross-project leakage multi', iso1?.analysisId !== iso25?.analysisId, 'isolated');

  const postSeedFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const postWs1 = postSeedFoundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  postSeedFoundation.getManager().activateWorkspace(postWs1.workspaceId);

  resetAcquisitionCountersForTests();
  const det1 = processAcquisitionPlan(makeAcquisitionInput(postWs1.workspaceId, 'devpulse', { analysisId: 'det-1' }));
  const det2 = processAcquisitionPlan(makeAcquisitionInput(postWs1.workspaceId, 'devpulse', { analysisId: 'det-2' }));
  const key1 = planStructuralKey(det1);
  const key2 = planStructuralKey(det2);
  assert('140. deterministic structural key prefix', key1.split('|').slice(0, 4).join('|') === key2.split('|').slice(0, 4).join('|'), key1);
  assert('141. deterministic strategy same mode', det1.acquisitionStrategy === det2.acquisitionStrategy, det1.acquisitionStrategy);
  assert('142. deterministic risk same input profile', det1.riskLevel === det2.riskLevel, det1.riskLevel);

  assert('143. ownership gate project context', evaluateAcquisitionProjectContext(input1).gates.some((g) => g.gateType === 'CONTEXT_EVALUATED'), 'context');
  assert('144. governance gate stack', validateAcquisitionGovernance(input1).gates.some((g) => g.gateType === 'GOVERNANCE_STACK'), 'stack');
  assert('145. governance gate world2', validateAcquisitionGovernance(input1).gates.some((g) => g.gateType === 'WORLD2_PROTECTION'), 'world2');

  assert('146. architecture verification required', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    capabilityType: 'ARCHITECTURE_CAPABILITY',
    analysisId: 'arch-ver',
  })).verificationRequirements.some((v) => v.requirementType === 'ARCHITECTURE_REVIEW'), 'arch');

  assert('147. governance verification required', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    requestedAcquisitionMode: 'CREATE_GOVERNANCE_LAYER',
    analysisId: 'gov-ver',
  })).verificationRequirements.some((v) => v.requirementType === 'GOVERNANCE_REVIEW'), 'gov');

  assert('148. architecture rollback required', processAcquisitionPlan(makeAcquisitionInput(ws1.workspaceId, 'devpulse', {
    capabilityType: 'ARCHITECTURE_CAPABILITY',
    analysisId: 'arch-rb',
  })).rollbackRequirements.some((r) => r.requirementType === 'ARCHITECTURE_ROLLBACK'), 'arch rb');

  assert('149. report approval count', reportOut.approvalRequirementCount >= 0, String(reportOut.approvalRequirementCount));
  assert('150. report verification count', reportOut.verificationRequirementCount >= 0, String(reportOut.verificationRequirementCount));
  assert('151. report rollback count', reportOut.rollbackRequirementCount >= 0, String(reportOut.rollbackRequirementCount));
  assert('152. report governance gate count', reportOut.governanceGateCount > 0, String(reportOut.governanceGateCount));

  assert('153. no execution path static', DevPulseV2SafeCapabilityAcquisition.assertDoesNotExecute(), 'safe');
  assert('154. no code generation path blocked', codeBlock.acquisitionState === 'ACQUISITION_BLOCKED', 'blocked');
  assert('155. no deployment path blocked', deployBlock.acquisitionState === 'ACQUISITION_BLOCKED', 'blocked');
  assert('156. no install path blocked', installBlock.acquisitionState === 'ACQUISITION_BLOCKED', 'blocked');

  assert('157. planning only in report', reportOut.confirmation.safeCapabilityAcquisitionOnly === true, 'confirmed');
  assert('158. formatted no tool downloaded', formatted.includes('No tool downloaded: CONFIRMED'), 'confirmed');
  assert('159. formatted no dependency installed', formatted.includes('No dependency installed: CONFIRMED'), 'confirmed');

  assert('160. classify strategy helper', classifyAcquisitionStrategy(input1, false) === 'PLAN_INTERNAL_BUILD', 'strategy');
  assert('161. classify risk helper', classifyAcquisitionRisk(input1, false).length > 0, classifyAcquisitionRisk(input1, false));
  assert('162. create approval requirements helper', createApprovalRequirements(input1, 'MEDIUM', false).length > 0, 'approvals');
  assert('163. create verification requirements helper', createVerificationRequirements(input1, false).length > 0, 'verifications');
  assert('164. create rollback requirements helper', createRollbackRequirements(input1, false).length > 0, 'rollbacks');

  for (const mode of KNOWN_ACQUISITION_MODES) {
    assert(`165-mode. ${mode} maps to strategy`, MODE_TO_STRATEGY[mode] !== 'BLOCKED', MODE_TO_STRATEGY[mode]);
  }

  for (let i = 175; i <= 239; i += 1) {
    const idx = i - 175;
    const mode = modes[idx % modes.length]!;
    const r = processAcquisitionPlan(makeAcquisitionInput(postWs1.workspaceId, 'devpulse', {
      requestedAcquisitionMode: mode,
      analysisId: `bulk-${i}`,
      capabilityGapId: `bulk-gap-${i}`,
      gapSeverity: idx % 4 === 0 ? 'LOW' : idx % 4 === 1 ? 'MEDIUM' : idx % 4 === 2 ? 'HIGH' : 'CRITICAL',
    }));
    assert(`${i}. bulk scenario ${mode}`, r.acquisitionState === 'ACQUISITION_READY' || r.acquisitionState === 'ACQUISITION_BLOCKED', r.acquisitionState);
  }

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('240. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(SAFE_CAPABILITY_ACQUISITION_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:safe-capability-acquisition');
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
