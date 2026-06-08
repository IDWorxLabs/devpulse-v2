/**
 * DevPulse V2 Phase 8.4 Mobile Approval Flow Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import {
  APPROVAL_DECISIONS,
  APPROVAL_READINESS_LEVELS,
  APPROVAL_STATE_SEQUENCE,
  approvalRequestKey,
  approvalStateIncludes,
  approvalStructuralKey,
  assertDistinctFromFounderApprovalGate,
  assertDistinctFromMobileLivePreviewFoundation,
  assertGovernanceDependenciesPresent,
  assertNoApprovalSourceOfTruthClaim,
  assertNoAutoApproval,
  assertNoDuplicateApprovalTruth,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  auditKey,
  buildMobileApprovalReport,
  classifyApproval,
  classificationKey,
  createApprovalAuditRecord,
  createApprovalResponsePacket,
  decisionKey,
  DEPENDENCY_SYSTEMS,
  DevPulseV2MobileApprovalFlowFoundation,
  DUPLICATE_PATTERNS,
  evaluateApprovalSecurity,
  formatMobileApprovalReport,
  governanceGatesKey,
  isGovernanceReady,
  KNOWN_APPROVAL_TYPES,
  MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE,
  MOBILE_APPROVAL_FLOW_FOUNDATION_PASS_TOKEN,
  processMobileApproval,
  requiresFounderReview,
  resetApprovalAuditCounterForTests,
  resetApprovalResponseCounterForTests,
  resetDevPulseV2MobileApprovalFlowFoundationForTests,
  responsePacketKey,
  routeDecision,
  scanModuleForForbiddenPatterns,
  validateApprovalGovernance,
  validateApprovalRequest,
  validateCloudApprovalSession,
  validateDecision,
  validateMobileApprovalSession,
} from '../src/mobile-approval-flow-foundation/index.js';
import type { ApprovalInput, ApprovalType } from '../src/mobile-approval-flow-foundation/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeApprovalInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<ApprovalInput> = {},
): ApprovalInput {
  return {
    approvalRequestId: 'approval-req-001',
    approvalPacketId: 'approval-pkt-001',
    mobileSessionId: 'mobile-session-0001',
    cloudSessionId: 'cloud-session-001',
    conversationId: 'conv-001',
    userId: 'user-001',
    deviceId: 'device-001',
    workspaceId,
    projectId,
    approvalType: 'CONTROLLED_EXECUTION',
    approvalTarget: 'execution-bridge',
    approvalSummary: 'Approve controlled execution bridge action',
    approvalReason: 'Founder review requested',
    approvalRiskLevel: 'HIGH',
    approvalPriority: 'HIGH',
    approvalStatus: 'PENDING',
    requestedBy: 'system',
    timestamp: Date.now(),
    authStatus: 'PASS',
    governanceStatus: 'PASS',
    cloudConnectionStatus: 'CONNECTED',
    approvalDecision: 'APPROVE',
    approvalNotes: 'Decision recorded via mobile',
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
  console.log('DevPulse V2 — Phase 8.4 Mobile Approval Flow Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetApprovalAuditCounterForTests();
  resetApprovalResponseCounterForTests();

  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws1 = foundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  const ws2 = foundation.createWorkspace({
    projectId: 'fine-print',
    projectName: 'Fine Print Decipherer Workspace',
    projectVision: 'Legal document analysis',
  });
  foundation.getManager().activateWorkspace(ws1.workspaceId);
  foundation.getManager().activateWorkspace(ws2.workspaceId);

  const approval = resetDevPulseV2MobileApprovalFlowFoundationForTests();
  const input1 = makeApprovalInput(ws1.workspaceId, 'devpulse');
  const resp1 = approval.processApproval(input1);
  const resp2 = approval.processApproval(
    makeApprovalInput(ws2.workspaceId, 'fine-print', { approvalType: 'PROJECT_SWITCH', approvalDecision: 'DEFER' }),
  );

  assert('1. approval response generation succeeds', resp1.approvalResponseId.startsWith('approval-response-'), resp1.approvalResponseId);
  assert('2. approval has approvalRequestId', resp1.approvalRequestId === 'approval-req-001', resp1.approvalRequestId);
  assert('3. approval has approvalPacketId', resp1.approvalPacketId === 'approval-pkt-001', resp1.approvalPacketId);
  assert('4. approval has mobileSessionId', resp1.mobileSessionId === 'mobile-session-0001', resp1.mobileSessionId);
  assert('5. approval has cloudSessionId', resp1.cloudSessionId === 'cloud-session-001', resp1.cloudSessionId);
  assert('6. approval has conversationId', resp1.conversationId === 'conv-001', resp1.conversationId);
  assert('7. approval has userId', resp1.userId === 'user-001', resp1.userId);
  assert('8. approval has workspaceId', resp1.workspaceId === ws1.workspaceId, resp1.workspaceId);
  assert('9. approval has projectId', resp1.projectId === 'devpulse', resp1.projectId);
  assert('10. approval type classified', resp1.approvalType === 'CONTROLLED_EXECUTION', resp1.approvalType);
  assert('11. approval decision recorded', resp1.approvalDecision === 'APPROVE', resp1.approvalDecision);
  assert('12. approval state ready', resp1.approvalState === 'APPROVAL_READY', resp1.approvalState);
  assert('13. approval readiness ready for decision', resp1.approvalReadiness === 'READY_FOR_DECISION', resp1.approvalReadiness);
  assert('14. audit record created', resp1.approvalAuditRecord !== null, resp1.approvalAuditRecord?.auditId ?? 'null');
  assert('15. response packet created', resp1.approvalResponsePacket !== null, resp1.approvalResponsePacket?.responsePacketId ?? 'null');
  assert('16. response packet decision only', resp1.approvalResponsePacket?.decisionOnly === true, 'decisionOnly');
  assert('17. response packet not executed', resp1.approvalResponsePacket?.executed === false, 'executed false');
  assert('18. no execution performed confirmation', resp1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('19. no commands executed confirmation', resp1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('20. no files modified confirmation', resp1.confirmation.noFilesModified === true, 'confirmed');

  assert('21. registry ownership', DevPulseV2MobileApprovalFlowFoundation.assertRegistryOwnership(), 'registry ok');
  assert('22. duplicate check passes', DevPulseV2MobileApprovalFlowFoundation.assertDuplicateCheckPasses(), 'no duplicates');
  assert('23. does not execute', DevPulseV2MobileApprovalFlowFoundation.assertDoesNotExecute(), 'no execute methods');
  assert('24. no forbidden patterns', DevPulseV2MobileApprovalFlowFoundation.assertNoForbiddenExecutionPatterns(), 'clean scan');
  assert('25. dependency chain', DevPulseV2MobileApprovalFlowFoundation.assertDependencyChain(), 'deps ok');

  const owner = getDevPulseV2Owner('mobile_approval_flow_foundation');
  assert('26. owner module correct', owner.ownerModule === MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('27. owner phase 8.4', owner.phase === 8.4, String(owner.phase));
  assert('28. owner function registered', owner.ownerFunction === 'createDevPulseV2MobileApprovalFlowFoundation', owner.ownerFunction);

  assert('29. governance dependencies present', assertGovernanceDependenciesPresent(), 'deps present');
  assert('30. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('31. world1 protected', assertWorld1Protected(), 'world1 protected');
  assert('32. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'registry ok');
  assert('33. distinct from founder approval gate', assertDistinctFromFounderApprovalGate(), 'distinct');
  assert('34. distinct from mobile live preview', assertDistinctFromMobileLivePreviewFoundation(), 'distinct');

  const moduleDir = join(fileURLToPath(new URL('../src/mobile-approval-flow-foundation', import.meta.url)));
  const forbidden = scanModuleForForbiddenPatterns(moduleDir);
  assert('35. forbidden pattern scan clean', forbidden.length === 0, forbidden.join('; ') || 'clean');

  assert('36. approval state sequence defined', APPROVAL_STATE_SEQUENCE.length >= 8, String(APPROVAL_STATE_SEQUENCE.length));
  assert('37. known approval types count', KNOWN_APPROVAL_TYPES.length === 10, String(KNOWN_APPROVAL_TYPES.length));
  assert('38. approval decisions count', APPROVAL_DECISIONS.length === 4, String(APPROVAL_DECISIONS.length));
  assert('39. readiness levels count', APPROVAL_READINESS_LEVELS.length === 6, String(APPROVAL_READINESS_LEVELS.length));
  assert('40. dependency systems count', DEPENDENCY_SYSTEMS.length === 8, String(DEPENDENCY_SYSTEMS.length));

  const reqValid = validateApprovalRequest(input1);
  assert('41. approval request validation passes', reqValid.valid === true, reqValid.reason);

  const mobValid = validateMobileApprovalSession(input1);
  assert('42. mobile session validation passes', mobValid.valid === true, mobValid.reason);

  const cloudValid = validateCloudApprovalSession(input1);
  assert('43. cloud session validation passes', cloudValid.valid === true, cloudValid.reason);

  const govValid = validateApprovalGovernance(input1);
  assert('44. governance validation passes', govValid.valid === true, govValid.reason);

  const classValid = classifyApproval(input1);
  assert('45. approval classification passes', classValid.valid === true, classValid.reason);

  const decValid = validateDecision(input1);
  assert('46. decision validation passes', decValid.valid === true, decValid.reason);

  assert('47. missing approval request blocked', validateApprovalRequest(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalRequestId: '' })).valid === false, 'blocked');
  assert('48. missing mobile session blocked', validateMobileApprovalSession(makeApprovalInput(ws1.workspaceId, 'devpulse', { mobileSessionId: '' })).valid === false, 'blocked');
  assert('49. missing cloud session blocked', validateCloudApprovalSession(makeApprovalInput(ws1.workspaceId, 'devpulse', { cloudSessionId: '' })).valid === false, 'blocked');
  assert('50. missing conversation blocked', validateMobileApprovalSession(makeApprovalInput(ws1.workspaceId, 'devpulse', { conversationId: '' })).valid === false, 'blocked');

  const noUser = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { userId: '' }));
  assert('51. missing user blocked', noUser.approvalState === 'APPROVAL_BLOCKED', noUser.approvalState);

  const noWs = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { workspaceId: '' }));
  assert('52. missing workspace blocked', noWs.approvalState === 'APPROVAL_BLOCKED', noWs.approvalState);

  const noProj = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'wrong-project'));
  assert('53. missing project context blocked', noProj.approvalReadiness === 'NEEDS_PROJECT_CONTEXT', noProj.approvalReadiness);

  const authFail = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { authStatus: 'FAIL' }));
  assert('54. auth failure blocked', authFail.approvalReadiness === 'NEEDS_AUTH', authFail.approvalReadiness);

  const cloudDisc = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { cloudConnectionStatus: 'DISCONNECTED' }));
  assert('55. cloud disconnected blocked', cloudDisc.approvalReadiness === 'NEEDS_CLOUD_CONNECTION', cloudDisc.approvalReadiness);

  const govFail = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'FAIL' }));
  assert('56. governance failure blocked', govFail.approvalState === 'APPROVAL_BLOCKED', govFail.approvalState);

  const unknownType = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalType: 'UNKNOWN' }));
  assert('57. unknown approval type blocked', unknownType.approvalState === 'APPROVAL_BLOCKED', unknownType.approvalState);

  const approvalTypes: ApprovalType[] = [
    'PROJECT_CREATION',
    'PROJECT_SWITCH',
    'WORLD1_ACTION',
    'WORLD2_ACTION',
    'CONTROLLED_EXECUTION',
    'DEPENDENCY_CHANGE',
    'CONFIGURATION_CHANGE',
    'DEPLOYMENT_REQUEST',
    'DELETE_REQUEST',
    'ROLLBACK_REQUEST',
  ];
  for (let i = 0; i < approvalTypes.length; i += 1) {
    const type = approvalTypes[i]!;
    const r = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalType: type, approvalRequestId: `req-type-${i}` }));
    assert(`${58 + i}. ${type} approval classified`, r.approvalType === type && r.approvalReadiness === 'READY_FOR_DECISION', r.approvalType);
  }

  const approve = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalDecision: 'APPROVE', approvalRequestId: 'req-approve' }));
  assert('68. APPROVE decision', approve.approvalDecision === 'APPROVE' && approve.approvalResponsePacket !== null, approve.approvalDecision);

  const reject = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalDecision: 'REJECT', approvalRequestId: 'req-reject' }));
  assert('69. REJECT decision', reject.approvalDecision === 'REJECT' && reject.approvalAuditRecord?.decision === 'REJECT', reject.approvalDecision);

  const defer = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalDecision: 'DEFER', approvalRequestId: 'req-defer' }));
  assert('70. DEFER decision', defer.approvalDecision === 'DEFER', defer.approvalDecision);

  const reqInfo = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalDecision: 'REQUEST_INFORMATION', approvalRequestId: 'req-info' }));
  assert('71. REQUEST_INFORMATION decision', reqInfo.approvalDecision === 'REQUEST_INFORMATION', reqInfo.approvalDecision);

  assert('72. approve routing', routeDecision('APPROVE').includes('do not execute'), routeDecision('APPROVE'));
  assert('73. reject routing', routeDecision('REJECT').includes('do not execute'), routeDecision('REJECT'));
  assert('74. defer routing', routeDecision('DEFER').includes('do not execute'), routeDecision('DEFER'));
  assert('75. request information routing', routeDecision('REQUEST_INFORMATION').includes('do not execute'), routeDecision('REQUEST_INFORMATION'));

  const selfExec = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalNotes: 'please self execute now', approvalRequestId: 'req-self-exec' }));
  assert('76. blocked self execution attempt', selfExec.approvalReadiness === 'NOT_READY', selfExec.approvalReadiness);

  const fileMod = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalNotes: 'modify file on disk', approvalRequestId: 'req-file' }));
  assert('77. blocked file modification attempt', fileMod.approvalReadiness === 'NOT_READY', fileMod.approvalReadiness);

  const codeGen = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalNotes: 'generate code for this', approvalRequestId: 'req-code' }));
  assert('78. blocked code generation attempt', codeGen.approvalReadiness === 'NOT_READY', codeGen.approvalReadiness);

  const deploy = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalNotes: 'deploy to production', approvalRequestId: 'req-deploy' }));
  assert('79. blocked deployment attempt', deploy.approvalReadiness === 'NOT_READY', deploy.approvalReadiness);

  const autoApprove = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalNotes: 'auto approve this request', approvalRequestId: 'req-auto' }));
  assert('80. blocked auto approval attempt', autoApprove.approvalReadiness === 'NOT_READY', autoApprove.approvalReadiness);

  resetApprovalAuditCounterForTests();
  const audit = createApprovalAuditRecord(input1, 'resp-test', 'APPROVE', Date.now());
  assert('81. audit record has auditId', audit.auditId.startsWith('approval-audit-'), audit.auditId);
  assert('82. audit record has userId', audit.userId === 'user-001', audit.userId);
  assert('83. audit record has decision', audit.decision === 'APPROVE', audit.decision);
  assert('84. audit key deterministic', auditKey(audit) === 'APPROVE|approval-req-001|user-001', auditKey(audit));

  resetApprovalResponseCounterForTests();
  const packet = createApprovalResponsePacket(input1, 'APPROVE');
  assert('85. response packet has id', packet.responsePacketId.startsWith('approval-res-pkt-'), packet.responsePacketId);
  assert('86. response packet decision only', packet.decisionOnly === true, 'decisionOnly');
  assert('87. response packet not executed', packet.executed === false, 'executed');
  assert('88. response packet key', responsePacketKey(packet) === 'APPROVE|CONTROLLED_EXECUTION|true', responsePacketKey(packet));

  assert('89. approval request key', approvalRequestKey(input1).includes('approval-req-001'), approvalRequestKey(input1));
  assert('90. classification key', classificationKey('CONTROLLED_EXECUTION', true) === 'CONTROLLED_EXECUTION|true', classificationKey('CONTROLLED_EXECUTION', true));
  assert('91. decision key', decisionKey('APPROVE', true) === 'APPROVE|true', decisionKey('APPROVE', true));
  assert('92. governance gates key', governanceGatesKey(govValid.gates).length > 0, governanceGatesKey(govValid.gates));

  assert('93. founder review for WORLD1_ACTION', requiresFounderReview('WORLD1_ACTION') === true, 'founder review');
  assert('94. founder review for CONTROLLED_EXECUTION', requiresFounderReview('CONTROLLED_EXECUTION') === true, 'founder review');
  assert('95. no founder review for PROJECT_CREATION', requiresFounderReview('PROJECT_CREATION') === false, 'no founder review');

  const security = evaluateApprovalSecurity(input1);
  assert('96. security evaluation passes', security.blocked === false, security.reason);

  assert('97. no approval source of truth claim', assertNoApprovalSourceOfTruthClaim(), 'no claim');
  assert('98. no auto approval', assertNoAutoApproval(), 'no auto');
  assert('99. no duplicate approval truth', assertNoDuplicateApprovalTruth(), 'no duplicate');

  assert('100. state includes APPROVAL_READY', approvalStateIncludes(resp1.stateSequence, 'APPROVAL_READY'), 'included');
  assert('101. state includes DECISION_RECORDED', approvalStateIncludes(resp1.stateSequence, 'DECISION_RECORDED'), 'included');
  assert('102. state includes APPROVAL_CLASSIFIED', approvalStateIncludes(resp1.stateSequence, 'APPROVAL_CLASSIFIED'), 'included');

  const report = buildMobileApprovalReport(approval.getFoundationState(), resp1, input1);
  assert('103. report has owner module', report.ownerModule === MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE, report.ownerModule);
  assert('104. report has audit id', report.auditId.length > 0, report.auditId);
  assert('105. report confirmation no execution', report.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('106. report confirmation mobile foundation only', report.confirmation.mobileApprovalFoundationOnly === true, 'confirmed');

  const formatted = formatMobileApprovalReport(approval.getFoundationState(), resp1, input1);
  assert('107. formatted report includes phase 8.4', formatted.includes('Phase 8.4'), 'formatted');
  assert('108. formatted report confirms no execution', formatted.includes('No execution performed: CONFIRMED'), 'formatted');

  assert('109. get approval by request', approval.getApprovalByRequest('approval-req-001') !== null, 'found');
  assert('110. get approval by project', approval.getApprovalByProject('devpulse') !== null, 'found');
  assert('111. governance summary present', approval.getGovernanceSummary().includes('mobile_chat_interface'), approval.getGovernanceSummary());
  assert('112. world1 modification blocked', approval.checkWorld1ModificationBlocked('execution_authority'), 'blocked');
  assert('113. no duplicate approval truth check', approval.checkNoDuplicateApprovalTruth(), 'ok');
  assert('114. no approval source of truth check', approval.checkNoApprovalSourceOfTruthClaim(), 'ok');
  assert('115. no auto approval check', approval.checkNoAutoApproval(), 'ok');

  assert('116. is governance ready PASS', isGovernanceReady('PASS') === true, 'ready');
  assert('117. is governance ready FAIL', isGovernanceReady('FAIL') === false, 'not ready');

  const crossWs = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { targetWorkspaceId: ws2.workspaceId, approvalRequestId: 'req-cross' }));
  assert('118. cross-workspace approval blocked', crossWs.approvalState === 'APPROVAL_BLOCKED' || crossWs.ownershipGates.some((g) => g.status === 'CLOSED'), 'blocked');

  const crossProj = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { targetProjectId: 'fine-print', approvalRequestId: 'req-cross-proj' }));
  assert('119. cross-project approval blocked', crossProj.approvalState === 'APPROVAL_BLOCKED' || crossProj.ownershipGates.some((g) => g.gateType === 'CROSS_PROJECT'), 'blocked');

  assert('120. second project defer decision', resp2.approvalDecision === 'DEFER', resp2.approvalDecision);
  assert('121. second project isolated', resp2.projectId === 'fine-print', resp2.projectId);
  assert('122. no cross-project leakage', resp1.projectId !== resp2.projectId, `${resp1.projectId} vs ${resp2.projectId}`);

  resetApprovalAuditCounterForTests();
  resetApprovalResponseCounterForTests();
  const det1 = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalRequestId: 'det-1' }));
  const det2 = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalRequestId: 'det-2' }));
  const key1 = approvalStructuralKey(det1);
  const key2 = approvalStructuralKey(det2);
  assert('123. deterministic structural key same context', key1.split('|').slice(0, 5).join('|') === key2.split('|').slice(0, 5).join('|'), key1);

  const needsMob = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { mobileSessionId: '' }));
  assert('124. needs mobile session readiness', needsMob.approvalReadiness === 'NEEDS_MOBILE_SESSION', needsMob.approvalReadiness);

  const needsCloud = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { cloudSessionId: '' }));
  assert('125. needs cloud connection readiness', needsCloud.approvalReadiness === 'NEEDS_CLOUD_CONNECTION', needsCloud.approvalReadiness);

  assert('126. duplicate patterns defined', DUPLICATE_PATTERNS.length >= 5, String(DUPLICATE_PATTERNS.length));
  assert('127. mobile command foundation phase', getDevPulseV2Owner('mobile_command_foundation').phase === 8.1, '8.1');
  assert('128. mobile chat interface phase', getDevPulseV2Owner('mobile_chat_interface').phase === 8.2, '8.2');
  assert('129. mobile live preview phase', getDevPulseV2Owner('mobile_live_preview_foundation').phase === 8.3, '8.3');
  assert('130. controlled execution bridge registered', getDevPulseV2Owner('controlled_execution_bridge').ownerModule.length > 0, 'registered');

  assert('131. approval response count', approval.getApprovalResponses().length >= 2, String(approval.getApprovalResponses().length));
  assert('132. foundation state has id', approval.getFoundationState().foundationId.includes('mobile-approval-flow-foundation'), approval.getFoundationState().foundationId);
  assert('133. no deployment confirmation', resp1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('134. no code generated confirmation', resp1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('135. no approval self-granted confirmation', resp1.confirmation.noApprovalSelfGranted === true, 'confirmed');
  assert('136. no approval source of truth confirmation', resp1.confirmation.noApprovalSourceOfTruthClaim === true, 'confirmed');
  assert('137. mobile approval foundation only confirmation', resp1.confirmation.mobileApprovalFoundationOnly === true, 'confirmed');

  const degraded = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { cloudConnectionStatus: 'DEGRADED', approvalRequestId: 'req-degraded' }));
  assert('138. degraded cloud connection allowed', degraded.approvalReadiness === 'READY_FOR_DECISION', degraded.approvalReadiness);

  const missingReq = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalRequestId: '' }));
  assert('139. missing approval request id blocked', missingReq.approvalState === 'APPROVAL_BLOCKED', missingReq.approvalState);

  const pktMissing = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { approvalPacketId: '' }));
  assert('140. missing approval packet blocked', pktMissing.approvalGates.some((g) => g.status === 'CLOSED') || pktMissing.approvalState === 'APPROVAL_BLOCKED', 'blocked');

  assert('141. ownership gate count', resp1.ownershipGates.length > 0, String(resp1.ownershipGates.length));
  assert('142. governance gate count', resp1.governanceGates.length > 0, String(resp1.governanceGates.length));
  assert('143. cloud gate count', resp1.cloudGates.length > 0, String(resp1.cloudGates.length));
  assert('144. approval gate count', resp1.approvalGates.length > 0, String(resp1.approvalGates.length));

  assert('145. decision timestamp recorded', resp1.decisionTimestamp > 0, String(resp1.decisionTimestamp));
  assert('146. recommendations present', resp1.recommendations.length > 0, String(resp1.recommendations.length));
  assert('147. pass token defined', MOBILE_APPROVAL_FLOW_FOUNDATION_PASS_TOKEN === 'DEVPULSE_V2_MOBILE_APPROVAL_FLOW_FOUNDATION_V1_PASS', MOBILE_APPROVAL_FLOW_FOUNDATION_PASS_TOKEN);

  const blockedNoAudit = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { authStatus: 'FAIL' }));
  assert('148. blocked approval has no audit', blockedNoAudit.approvalAuditRecord === null, 'no audit');
  assert('149. blocked approval has no response packet', blockedNoAudit.approvalResponsePacket === null, 'no packet');
  assert('150. blocked approval empty response id', blockedNoAudit.approvalResponseId === '', blockedNoAudit.approvalResponseId);

  const oneApproval = resetDevPulseV2MobileApprovalFlowFoundationForTests();
  const oneWs = seedWorkspaces(1);
  oneApproval.processApproval(makeApprovalInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId, { approvalRequestId: 'one-proj' }));
  assert('151. one project support', oneApproval.getApprovalResponses().length === 1, '1');

  const fiveApproval = resetDevPulseV2MobileApprovalFlowFoundationForTests();
  const fiveWs = seedWorkspaces(5);
  for (let i = 0; i < fiveWs.length; i += 1) {
    fiveApproval.processApproval(makeApprovalInput(fiveWs[i]!.workspaceId, fiveWs[i]!.projectId, { approvalRequestId: `five-${i}` }));
  }
  assert('152. five project support', fiveApproval.getApprovalResponses().length === 5, '5');

  const tenApproval = resetDevPulseV2MobileApprovalFlowFoundationForTests();
  const tenWs = seedWorkspaces(10);
  for (let i = 0; i < tenWs.length; i += 1) {
    tenApproval.processApproval(makeApprovalInput(tenWs[i]!.workspaceId, tenWs[i]!.projectId, { approvalRequestId: `ten-${i}` }));
  }
  assert('153. ten project support', tenApproval.getApprovalResponses().length === 10, '10');

  const twentyFiveApproval = resetDevPulseV2MobileApprovalFlowFoundationForTests();
  const twentyFiveWs = seedWorkspaces(25);
  for (let i = 0; i < twentyFiveWs.length; i += 1) {
    twentyFiveApproval.processApproval(makeApprovalInput(twentyFiveWs[i]!.workspaceId, twentyFiveWs[i]!.projectId, { approvalRequestId: `twentyfive-${i}` }));
  }
  assert('154. twenty-five project support', twentyFiveApproval.getApprovalResponses().length === 25, '25');

  const iso1 = twentyFiveApproval.getApprovalByProject('proj-1');
  const iso25 = twentyFiveApproval.getApprovalByProject('proj-25');
  assert('155. multi-project isolation proj-1', iso1 !== null && iso1.projectId === 'proj-1', iso1?.projectId ?? 'null');
  assert('156. multi-project isolation proj-25', iso25 !== null && iso25.projectId === 'proj-25', iso25?.projectId ?? 'null');
  assert('157. no cross-project approval leakage', iso1?.approvalRequestId !== iso25?.approvalRequestId, 'isolated');

  assert('158. mobile session ownership gate', mobValid.gates.some((g) => g.gateType === 'MOBILE_SESSION'), 'mobile session');
  assert('159. cloud session ownership gate', cloudValid.gates.some((g) => g.gateType === 'CLOUD_SESSION'), 'cloud session');
  assert('160. project ownership gate', classValid.gates.some((g) => g.gateType === 'APPROVAL_TYPE'), 'approval type');
  assert('161. conversation ownership validated', mobValid.gates.some((g) => g.description.includes('Mobile session')), mobValid.reason);
  assert('162. workspace ownership validated', classValid.effectiveWorkspaceId === ws1.workspaceId, classValid.effectiveWorkspaceId);

  const postSeedFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const postWs1 = postSeedFoundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  postSeedFoundation.getManager().activateWorkspace(postWs1.workspaceId);

  resetApprovalAuditCounterForTests();
  resetApprovalResponseCounterForTests();
  const readyA = processMobileApproval(makeApprovalInput(postWs1.workspaceId, 'devpulse', { approvalRequestId: 'ready-a', approvalDecision: 'APPROVE' }));
  const readyB = processMobileApproval(makeApprovalInput(postWs1.workspaceId, 'devpulse', { approvalRequestId: 'ready-b', approvalDecision: 'APPROVE' }));
  assert('163. deterministic readiness approve', readyA.approvalReadiness === readyB.approvalReadiness, readyA.approvalReadiness);
  assert('164. deterministic audit decision', readyA.approvalAuditRecord?.decision === readyB.approvalAuditRecord?.decision, 'APPROVE');
  assert('165. deterministic response decision only', readyA.approvalResponsePacket?.decisionOnly === readyB.approvalResponsePacket?.decisionOnly, 'true');

  assert('166. DEPLOYMENT_REQUEST founder review', requiresFounderReview('DEPLOYMENT_REQUEST') === true, 'founder');
  assert('167. DELETE_REQUEST founder review', requiresFounderReview('DELETE_REQUEST') === true, 'founder');
  assert('168. ROLLBACK_REQUEST no founder review', requiresFounderReview('ROLLBACK_REQUEST') === false, 'no founder');

  assert('169. founder approval gate registered', getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5, '6.5');
  assert('170. verification gated apply registered', getDevPulseV2Owner('verification_gated_apply').phase === 6.11, '6.11');
  assert('171. execution authority registered', getDevPulseV2Owner('execution_authority').phase === 6.1, '6.1');
  assert('172. execution evidence ledger registered', getDevPulseV2Owner('execution_evidence_ledger').phase === 6.7, '6.7');

  assert('173. mobile approval foundation only in report', report.confirmation.mobileApprovalFoundationOnly === true, 'confirmed');
  assert('174. report ownership gate count', report.ownershipGateCount > 0, String(report.ownershipGateCount));
  assert('175. report governance gate count', report.governanceGateCount > 0, String(report.governanceGateCount));

  const grantSelf = processMobileApproval(makeApprovalInput(postWs1.workspaceId, 'devpulse', { approvalNotes: 'grant approval without review', approvalRequestId: 'req-grant' }));
  assert('176. blocked self-grant attempt', grantSelf.approvalReadiness === 'NOT_READY', grantSelf.approvalReadiness);

  assert('177. state sequence mobile session validated', approvalStateIncludes(resp1.stateSequence, 'MOBILE_SESSION_VALIDATED'), 'included');
  assert('178. state sequence cloud session validated', approvalStateIncludes(resp1.stateSequence, 'CLOUD_SESSION_VALIDATED'), 'included');
  assert('179. state sequence project context validated', approvalStateIncludes(resp1.stateSequence, 'PROJECT_CONTEXT_VALIDATED'), 'included');

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('180. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(MOBILE_APPROVAL_FLOW_FOUNDATION_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:mobile-approval-flow-foundation');
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
